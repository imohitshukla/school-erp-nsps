const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runTest() {
  try {
    // 1. Check if the template for 7th A has annual fees configured
    console.log("=== 1. Checking Fee Template for '7th A' ===");
    const tplRes = await pool.query("SELECT * FROM class_fee_templates WHERE class_name = '7th A'");
    console.table(tplRes.rows);

    // 2. Apply template to 7th A (simulate calling the API)
    console.log("\n=== 2. Applying Template ===");
    const feeSetupController = require('./src/controllers/feeSetupController');
    const req = {
      body: { class_name: '7th A', academic_year: '2026-2027' },
      user: { school_id: 1 }
    };
    const res = {
      json: (data) => console.log("Success:", data.message),
      status: (code) => ({ json: (data) => console.log("Error:", data.error) })
    };
    
    // We have to mock db in the controller context since it imports its own db pool
    const db = require('./src/db');
    db.query = pool.query.bind(pool);
    
    await feeSetupController.applyTemplate(req, res);

    // 3. Check the monthly dues for student 611Ns
    console.log("\n=== 3. Checking Monthly Dues for student '611Ns' ===");
    const duesRes = await pool.query(
      "SELECT month_name, month_index, is_one_time, tuition_due, transport_due, admission_fee_due, annual_fee_due, id_card_due, exam_fee_due, other_due FROM student_monthly_dues WHERE student_adm_no = '611Ns' ORDER BY month_index ASC"
    );
    console.table(duesRes.rows);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    pool.end();
  }
}

runTest();
