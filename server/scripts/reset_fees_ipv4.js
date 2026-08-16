require('dotenv').config();
const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL;
// Change port 5432 to 6543 to use Supabase IPv4 connection pooler
if (dbUrl.includes(':5432/')) {
  dbUrl = dbUrl.replace(':5432/', ':6543/');
}

console.log('Connecting with URL:', dbUrl.replace(/:[^:@]+@/, ':***@'));

const pool = new Pool({
  connectionString: dbUrl,
});

async function resetFees() {
  try {
    console.log('Truncating fee_ledger...');
    await pool.query('TRUNCATE TABLE fee_ledger CASCADE;');
    
    console.log('Truncating student_monthly_dues...');
    await pool.query('TRUNCATE TABLE student_monthly_dues CASCADE;');
    
    console.log('Truncating class_fee_templates...');
    await pool.query('TRUNCATE TABLE class_fee_templates CASCADE;');
    
    console.log('Resetting paid_past on students...');
    await pool.query('UPDATE students SET paid_past = 0, payable_fee = 0;');

    console.log('✅ Fee data successfully reset. You can now start fresh.');
  } catch (error) {
    console.error('❌ Error resetting fee data:', error);
  } finally {
    await pool.end();
  }
}

resetFees();
