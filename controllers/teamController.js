const db = require('../db');

exports.index = async (req, res, next) => {
  try {
    const { rows: people } = await db.query(`
      SELECT id, name, role, photo_url, bio, sort_order
      FROM team
      ORDER BY sort_order ASC, id ASC;
    `);

    res.render('team', { title: 'Our Team', people });
  } catch (e) {
    next(e);
  }
};