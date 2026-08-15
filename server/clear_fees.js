require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearFees() {
  try {
    console.log('Connecting to Supabase...');
    await pool.query('DELETE FROM fee_ledger');
    console.log('Cleared fee_ledger');
    await pool.query('DELETE FROM student_monthly_dues');
    console.log('Cleared student_monthly_dues');
    
    // Reset student fee amounts just in case
    await pool.query('UPDATE students SET payable_fee = 0, transport_fee = 0, concession = 0');
    console.log('Reset student fee amounts');
    
    console.log('Fee data cleared successfully!');
  } catch (err) {
    console.error('Error clearing data:', err);
  } finally {
    pool.end();
  }
}

clearFees();
