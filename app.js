const express = require('express');
const app = express();
app.set("trust proxy", 1);
const path = require('path');
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const sharp = require('sharp');
const fs = require('fs/promises');
const r2 = require("./services/r2");
const { Readable } = require("stream");
const publicRoot = path.join(__dirname, "public");
const imgProxy = require("./routes/imgProxy");
const cron = require("node-cron");
const { runIgTokenMonitor } = require("./services/igTokenMonitor");
const schedule = process.env.IG_MONITOR_CRON || "0 9 * * *";
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: process.env.NODE_ENV === "production"
      ? { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: false }
      : false,
  })
);

// NEW: Auth/session deps
const { Pool } = require('pg');                                  // NEW
const session = require('express-session');                      // NEW
const PgSession = require('connect-pg-simple')(session);         // NEW
const passport = require('passport');                            // NEW
const LocalStrategy = require('passport-local').Strategy;        // NEW
const bcrypt = require('bcrypt');                                // NEW
const flash = require('connect-flash');


cron.schedule(schedule, () => {
  console.log("[IG MONITOR] cron fired", new Date().toISOString());
  runIgTokenMonitor().catch((e) => console.error("IG token monitor error:", e));
});

async function streamToBuffer(body) {
  const chunks = [];
  for await (const chunk of body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

app.use("/contact", rateLimit({ windowMs: 15*60*1000, max: 50 }));
app.use("/auth/login", rateLimit({ windowMs: 15*60*1000, max: 20 }));

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

app.use(flash());

app.use((req, res, next) => {
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  next();
});

// NEW: Passport local strategy
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    email = (email || '').trim().toLowerCase();
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

app.use(imgProxy);

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

// NEW (optional): quick check route to verify login works
app.get('/whoami', (req, res) => res.json(req.user || null));

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
