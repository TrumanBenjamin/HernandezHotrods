// db/check.js
require('dotenv').config();
const db = require('./index');

(async () => {
  try {
    const { rows } = await db.query('SELECT 1 AS ok');
    console.log('DB check result:', rows[0]); // should log: { ok: 1 }
    process.exit(0);
  } catch (err) {
    console.error('DB check failed:', err.message);
    process.exit(1);
  }
})();
