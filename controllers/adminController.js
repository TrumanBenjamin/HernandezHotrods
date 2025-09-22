// adjust this require to your pool/pg client location
const pool = require('../db');

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
      SELECT id, title, price
      FROM for_sale_items
      ORDER BY created_at DESC
    `).catch(() => ({ rows: [] })); // temp safety if table not ready

    const teamQ = pool.query(`
      SELECT id, name, role
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
