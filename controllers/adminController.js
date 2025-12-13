// adjust this require to your pool/pg client location
const pool = require('../db');

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
    // pull only what you need; tweak columns as desired
    const buildsQ = pool.query(`
      SELECT id, slug, name, is_completed
      FROM builds
      ORDER BY created_at DESC
    `);

    // TODO: replace these with your real tables when ready
    const forSaleQ = pool.query(`
      SELECT id, title, description, is_active, posted_at
      FROM for_sale_items
      ORDER BY posted_at DESC NULLS LAST, id DESC
    `).catch(() => ({ rows: [] })); // temp safety if table not ready

    const teamQ = pool.query(`
      SELECT id, name, role, photo_url, bio 
      FROM team
      ORDER BY id DESC
    `).catch(() => ({ rows: [] }));

    const [buildsRes, forSaleRes, teamRes] = await Promise.all([buildsQ, forSaleQ, teamQ]);

    res.render('admin/dashboard', {
      title: 'Admin',
      builds: buildsRes.rows,
      forSale: forSaleRes.rows,
      team: teamRes.rows,
      user: req.user, // if you want "Hello, Truman!" dynamically
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    // still render with empty arrays so EJS never crashes
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

    // optional: basic sanity check
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



