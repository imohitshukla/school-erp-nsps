require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const dbUrl = new URL(process.env.DATABASE_URL);

const pool = new Pool({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: dbUrl.pathname.slice(1),
  user: `postgres.ifiqxahlwoqvjxsrafph`,
  password: decodeURIComponent(dbUrl.password),
  ssl: { rejectUnauthorized: false },
});

async function resetPassword() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.error("Usage: node reset_password.js <username> <new_password>");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [passwordHash, username]
    );

    if (result.rows.length > 0) {
      console.log(`Successfully updated password for ${username}`);
    } else {
      console.log(`User ${username} not found!`);
    }
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    client.release();
    pool.end();
  }
}

resetPassword();
