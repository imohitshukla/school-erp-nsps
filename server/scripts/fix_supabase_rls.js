require('dotenv').config();
const { Pool } = require('pg');

const dbUrl = new URL(process.env.DATABASE_URL);

const pool = new Pool({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: dbUrl.pathname.slice(1),
  user: `postgres.ifiqxahlwoqvjxsrafph`,
  password: decodeURIComponent(dbUrl.password),
  ssl: { rejectUnauthorized: false },
});

async function fixRLS() {
  const client = await pool.connect();
  try {
    console.log('Fetching all tables in public schema...');
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);

    const tables = result.rows;
    console.log(`Found ${tables.length} tables.`);

    for (let row of tables) {
      const table = row.tablename;
      console.log(`Enabling Row-Level Security on table: ${table}`);
      await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
    }

    console.log('\nSUCCESS! RLS is now enabled on all public tables.');
    console.log('Since your Node.js backend connects using the "postgres" role, it automatically bypasses RLS.');
    console.log('However, this completely blocks unauthorized access via the Supabase Data API, fixing the security vulnerabilities reported in your email.');
    
  } catch (err) {
    console.error('Error fixing RLS:', err);
  } finally {
    client.release();
    pool.end();
  }
}

fixRLS();
