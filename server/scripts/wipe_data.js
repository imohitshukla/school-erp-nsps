require('dotenv').config();
const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL;
if (dbUrl.includes(':5432/')) {
  dbUrl = dbUrl.replace(':5432/', ':6543/');
}

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 10000,
});

async function resetFees() {
  const client = await pool.connect();
  try {
    console.log('Using connection:', dbUrl.replace(/:[^:@]+@/, ':***@'));
    
    // Kill other active queries that might be holding locks
    console.log('Killing hanging queries...');
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid()
        AND datname = current_database();
    `);

    console.log('Executing DELETE queries...');
    await client.query('DELETE FROM fee_ledger;');
    await client.query('DELETE FROM student_monthly_dues;');
    await client.query('DELETE FROM class_fee_templates;');
    await client.query('UPDATE students SET paid_past = 0, payable_fee = 0;');

    console.log('✅ Fee data successfully reset.');
  } catch (error) {
    console.error('❌ Error resetting fee data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetFees();
