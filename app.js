const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');

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

const servicesRoute = require('./routes/servicesRoute');
app.use('/services', servicesRoute);

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

app.use('/', require('./routes/adminBuilds'));

// NEW (optional): quick check route to verify login works
app.get('/whoami', (req, res) => res.json(req.user || null));

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
