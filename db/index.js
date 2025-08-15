// db/index.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// helpful during dev: crash if the pool errors unexpectedly
pool.on('error', (err) => {
  console.error('Unexpected PG error:', err);
  process.exit(1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
