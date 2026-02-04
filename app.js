const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const sharp = require('sharp');
const fs = require('fs/promises');
const { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");
const publicRoot = path.join(__dirname, "public");


// NEW: Auth/session deps
const { Pool } = require('pg');                                  // NEW
const session = require('express-session');                      // NEW
const PgSession = require('connect-pg-simple')(session);         // NEW
const passport = require('passport');                            // NEW
const LocalStrategy = require('passport-local').Strategy;        // NEW
const bcrypt = require('bcrypt');                                // NEW

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function streamToBuffer(body) {
  const chunks = [];
  for await (const chunk of body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// Will use views/layout.ejs
app.use(expressLayouts);
app.set('layout', 'layout'); 

// View Engine (keep where you had it)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// NEW: DB pool for auth + session store
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // NEW

// NEW: Session (Postgres-backed)
app.use(
  session({
    store: new PgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET,           // set this in .env
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// NEW: Passport local strategy
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
      const user = rows[0];
      if (!user) return done(null, false); // invalid email
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return done(null, false);   // invalid password

      return done(null, { id: user.id, email: user.email, role: user.role, name: user.name });
    } catch (e) {
      return done(e);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id)); // NEW
passport.deserializeUser(async (id, done) => {               // NEW
  try {
    const { rows } = await pool.query('SELECT id, email, role, name FROM users WHERE id=$1', [id]);
    done(null, rows[0]);
  } catch (e) {
    done(e);
  }
});

app.use(passport.initialize()); // NEW
app.use(passport.session());    // NEW

// NEW: expose user to EJS (so you can show/hide the Admin icon later)
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
});

app.use((req, res, next) => {
  res.locals.R2_BASE = process.env.R2_PUBLIC_BASE_URL;
  next();
});


// --- Your existing routes ---
const staticRoutes = require('./routes/staticRoutes');
app.use('/', staticRoutes);


const contactRoute = require('./routes/contactRoute');
app.use('/contact', contactRoute);

// NEW: auth routes (create ./routes/auth.js as in the earlier step)
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Routes
// mount the builds router
const buildsRouter = require('./routes/builds');
app.use('/builds', buildsRouter);

const homeRoutes = require('./routes/homeRoutes');
app.use('/', homeRoutes);

const forSaleRoutes = require('./routes/forSale');
app.use('/forSale', forSaleRoutes);

const teamRoutes = require('./routes/team');
app.use('/team', teamRoutes);

const shopRoutes = require('./routes/shopRoute');
app.use('/shop', shopRoutes);

app.use('/', require('./routes/adminBuilds'));

app.get("/img/:w/:q/*", async (req, res) => {
  try {
    const width = Math.max(1, Math.min(parseInt(req.params.w, 10) || 0, 3000));
    const quality = Math.max(30, Math.min(parseInt(req.params.q, 10) || 0, 95));

    let relPath = decodeURIComponent(req.params[0] || "");

    // If someone accidentally passed a full URL, strip to pathname
    if (relPath.startsWith("http://") || relPath.startsWith("https://")) {
      try { relPath = new URL(relPath).pathname; } catch (_) {}
    }

    relPath = relPath.replace(/^\/+/, ""); // no leading slash
    relPath = relPath.replace(/\\/g, "/"); // windows slashes -> url slashes
    if (!relPath || relPath.includes("..")) return res.status(400).send("Bad path");

    // HEAD source object for cache-busting token
    const head = await r2.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: relPath,
    }));

    const etag = String(head.ETag || "").replace(/"/g, "");
    const v = `${etag}_${head.ContentLength || 0}`;

    const accept = req.headers["accept"] || "";
    const toWebP = accept.includes("image/avif") || accept.includes("image/webp");


    const baseName = relPath.replace(/[\\/]/g, "_");
    const outExt = toWebP ? "webp" : "jpg";

    const outName = `${width}_${quality}_${baseName}_${v}.${outExt}`;

    // R2 cache key (resized outputs go here)
    const r2CacheKey = `cache/img/${outName}`;

    // 1) Try R2 resized-cache first (shared across everyone)
    try {
      const cachedObj = await r2.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: r2CacheKey,
      }));

      const buf = await streamToBuffer(cachedObj.Body);

      res.setHeader("X-IMG-SOURCE", "R2-CACHE");

      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.type(outExt);
      return res.send(buf);
    } catch (_) {
      // miss -> continue
    }

    // 2) Fetch original from R2, resize, respond
    const obj = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: relPath, // ✅ WAS "key" (undefined)
    }));

    const inputBuf = await streamToBuffer(obj.Body);

    let pipeline = sharp(inputBuf).rotate();
    if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });

    pipeline = toWebP
      ? pipeline.webp({ quality })
      : pipeline.jpeg({ quality, mozjpeg: true });

    const buf = await pipeline.toBuffer();

    // ✅ IMPORTANT: write resized output back to R2 cache (shared across everyone)
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: r2CacheKey,
      Body: buf,
      ContentType: toWebP ? "image/webp" : "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    res.setHeader("X-IMG-SOURCE", "R2-ORIGIN-RESIZED");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.type(outExt);
    return res.send(buf);
  } catch (err) {
    console.error("img proxy error:", err);
    return res.status(404).end();
  }
});

// NEW (optional): quick check route to verify login works
app.get('/whoami', (req, res) => res.json(req.user || null));

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
