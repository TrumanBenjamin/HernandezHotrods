
const pool = require('../db');
const bcrypt = require('bcrypt');

async function getCurrentIgToken() {
  const { rows } = await pool.query(
    `SELECT access_token, expires_at
     FROM ig_tokens
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return rows[0] || null;
}

async function saveNewIgToken(accessToken, expiresInSeconds) {
  const { rows } = await pool.query(
    `INSERT INTO ig_tokens (access_token, expires_at)
     VALUES ($1, NOW() + ($2::text || ' seconds')::interval)
     RETURNING *`,
    [accessToken, expiresInSeconds]
  );
  return rows[0];
}

exports.dashboard = async (req, res) => {
  try {
    const buildsQ = pool.query(`
      SELECT id, slug, name, is_completed
      FROM builds
      ORDER BY created_at DESC
    `);

    const forSaleQ = pool.query(`
      SELECT id, title, description, is_active, posted_at
      FROM for_sale_items
      ORDER BY posted_at DESC NULLS LAST, id DESC
    `).catch(() => ({ rows: [] }));

    const teamQ = pool.query(`
      SELECT id, name, role, photo_url, bio 
      FROM team
      ORDER BY sort_order ASC NULLS LAST, id ASC
    `).catch(() => ({ rows: [] }));

    const [buildsRes, forSaleRes, teamRes] = await Promise.all([buildsQ, forSaleQ, teamQ]);
    

    res.render('admin/dashboard', {
      title: 'Admin',
      builds: buildsRes.rows,
      forSale: forSaleRes.rows,
      team: teamRes.rows,
      user: req.user,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.render('admin/dashboard', { title: 'Admin', builds: [], forSale: [], team: [], user: req.user });
  }
};

async function getCurrentIgTokenRow() {
  const { rows } = await pool.query(
    `SELECT id, access_token, expires_at, created_at
     FROM ig_tokens
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return rows[0] || null;
}

// GET /admin/ig-token  -> show current token info + form to paste new one
exports.showIgTokenSettings = async (req, res) => {
  try {
    const current = await getCurrentIgTokenRow();
    res.render('admin/ig-token', {
      title: 'Instagram Access Token',
      user: req.user,
      current,
      saved: req.query.saved === '1',
    });
  } catch (err) {
    console.error('Error loading IG token settings:', err);
    res.status(500).send('Error loading Instagram token settings.');
  }
};

// POST /admin/ig-token  -> save a new token from admin form
exports.updateIgToken = async (req, res) => {
  try {
    const raw = req.body.token;
    if (!raw || !raw.trim()) {
      return res.status(400).send('Token is required.');
    }

    const token = raw.trim();

    if (token.length < 50) {
      return res.status(400).send('Token looks too short.');
    }

    const { rows } = await pool.query(
      `INSERT INTO ig_tokens (access_token, expires_at)
       VALUES ($1, NOW() + INTERVAL '60 days')
       RETURNING id`,
      [token]
    );

    console.log('Saved new IG token with id:', rows[0].id);

    res.redirect('/admin/ig-token?saved=1');
  } catch (err) {
    console.error('Error saving IG token:', err);
    res.status(500).send('Error saving Instagram token.');
  }
};

// New Admin User

exports.newUserForm = (req, res) => {
  res.render('admin/newUser', {
    title: 'Create User',
    user: req.user,
    message: null,
    error: null
  });
};

exports.createUser = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const pass  = (req.body.password || '').trim();
    const name  = (req.body.name || '').trim();
    const role  = 'admin';

    if (!email || !pass || !name) {
      return res.render('admin/newUser', {
        title: 'Create User',
        user: req.user,
        message: null,
        error: 'Email, password, and name are required.'
      });
    }

    const hash = await bcrypt.hash(pass, 12);

    await pool.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             name = EXCLUDED.name`,
      [email, hash, role, name]
    );

    return res.render('admin/newUser', {
      title: 'Create User',
      user: req.user,
      message: `User saved: ${email}`,
      error: null
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.render('admin/newUser', {
      title: 'Create User',
      user: req.user,
      message: null,
      error: 'Failed to create user. Check server logs.'
    });
  }
};



