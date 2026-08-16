require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetFees() {
  console.log('Connecting to database...');
  try {
    // We will truncate the tables related to fees.
    // CASCADE will ensure any foreign key dependencies (if any) are also cleared.
    console.log('Truncating fee_ledger...');
    await pool.query('TRUNCATE TABLE fee_ledger CASCADE;');
    
    console.log('Truncating student_monthly_dues...');
    await pool.query('TRUNCATE TABLE student_monthly_dues CASCADE;');
    
    console.log('Truncating class_fee_templates...');
    await pool.query('TRUNCATE TABLE class_fee_templates CASCADE;');
    
    // Also reset the paid_past on students
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
