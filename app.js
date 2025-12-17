const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const sharp = require('sharp');
const fs = require('fs/promises');

// NEW: Auth/session deps
const { Pool } = require('pg');                                  // NEW
const session = require('express-session');                      // NEW
const PgSession = require('connect-pg-simple')(session);         // NEW
const passport = require('passport');                            // NEW
const LocalStrategy = require('passport-local').Strategy;        // NEW
const bcrypt = require('bcrypt');                                // NEW

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

app.get('/img/:w/:q/*', async (req, res) => {
  try {
    const width = Math.max(1, Math.min(parseInt(req.params.w, 10) || 0, 3000)); // clamp 1..3000
    const quality = Math.max(30, Math.min(parseInt(req.params.q, 10) || 0, 95)); // clamp 30..95
    const relPath = req.params[0]; // original path after /img/w/q/

    // Construct absolute path to original under /public
    const srcAbs = path.join(__dirname, 'public', relPath);
    const normalized = path.normalize(srcAbs);
    const publicRoot = path.join(__dirname, 'public');

    // Guard: must stay within /public
    if (!normalized.startsWith(publicRoot)) return res.status(400).send('Bad path');

    // Decide output format based on Accept header
    const accept = req.headers['accept'] || '';
    const toWebP = accept.includes('image/avif') || accept.includes('image/webp');

    // Build cache path: /public/.cache/img/<w>_<q>_<hash-or-name>.(webp|jpg)
    const cacheDir = path.join(publicRoot, '.cache', 'img');
    await fs.mkdir(cacheDir, { recursive: true });

    const baseName = relPath.replace(/[\\/]/g, '_'); // safe file name
    const outExt = toWebP ? 'webp' : 'jpg';

    // 👇 ADD THIS: version token changes whenever the source file changes
    const st = await fs.stat(srcAbs);
    const v = `${Math.floor(st.mtimeMs)}_${st.size}`; // stable + fast

    const outName = `${width}_${quality}_${baseName}_${v}.${outExt}`;
    const cacheAbs = path.join(cacheDir, outName);

    // If cached file exists, stream it
    try {
      await fs.access(cacheAbs);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.type(outExt);
      return res.sendFile(cacheAbs);
    } catch (_) {}

    // Generate
    let pipeline = sharp(srcAbs).rotate(); // auto-orient
    if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });

    if (toWebP) {
      pipeline = pipeline.webp({ quality });
    } else {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }

    const buf = await pipeline.toBuffer();
    await fs.writeFile(cacheAbs, buf);

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.type(outExt);
    res.send(buf);
  } catch (err) {
    console.error('img proxy error:', err);
    res.status(404).end();
  }
});

// NEW (optional): quick check route to verify login works
app.get('/whoami', (req, res) => res.json(req.user || null));

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
