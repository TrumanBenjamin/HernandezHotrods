require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const email = process.argv[2] || 'admin@local';
  const pass  = process.argv[3] || 'ChangeMe123!';
  const name  = process.argv[4] || 'Admin';
  const hash  = await bcrypt.hash(pass, 12);    
  
  await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES ($1,$2,'admin',$3)
     ON CONFLICT (email) DO UPDATE 
       SET password_hash=$2, name=$3`,
    [email, hash, name]
  );

  console.log('Admin ready:', email, 'Name:', name);
  await pool.end();
})();