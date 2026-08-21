const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let token = '';

async function runTests() {
  console.log('--- Starting API Live Test ---');
  
  try {
    // 1. Login
    console.log('\\n[1] Testing Login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin1@school.com',
      password: '123456'
    });
    token = loginRes.data.token;
    console.log('✅ Login successful');

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Dashboard Stats
    console.log('\\n[2] Testing Dashboard Stats...');
    const statsRes = await axios.get(`${BASE_URL}/api/students/stats?academicYear=2026-2027`);
    console.log('✅ Stats fetched successfully');
    console.log(`Active Students: ${statsRes.data.totalActive}`);
    console.log(`Male: ${statsRes.data.totalMale}, Female: ${statsRes.data.totalFemale}`);

    // 3. Add a test student
    console.log('\\n[3] Testing Student Admission...');
    const newStudent = {
      adm_no: 'TEST-999',
      name: 'Test QA Student',
      class_name: '1st',
      gender: 'Male',
      category: 'General',
      transport_fee: 1000,
      tuition_fee: 2000,
      father_name: 'Test Father'
    };
    
    // First, try to delete if exists
    try {
      await axios.delete(`${BASE_URL}/api/students/adm/TEST-999`);
    } catch (e) {} // ignore

    const addStudentRes = await axios.post(`${BASE_URL}/api/students?academicYear=2026-2027`, newStudent);
    console.log('✅ Student TEST-999 created successfully');

    // 4. Manual Fee Entry
    console.log('\\n[4] Testing Manual Fee Entry...');
    const manualFeeRes = await axios.post(`${BASE_URL}/api/fees/manual-entry?academicYear=2026-2027`, {
      admission_number: 'TEST-999',
      billing_month: 'April',
      payment_date: new Date().toISOString().split('T')[0],
      tuition_amount: 2000,
      transport_amount: 1000,
      payment_mode: 'Cash'
    });
    console.log(`✅ Manual Fee Entry successful. Receipt: ${manualFeeRes.data.receipt_no}`);

    // Apply template to generate dues
    console.log('\\n[4.5] Applying fee template for student...');
    await axios.post(`${BASE_URL}/api/fee-setup/apply-single`, {
      adm_no: 'TEST-999',
      academicYear: '2026-2027'
    });
    console.log('✅ Template applied.');

    // 5. Take Fee (Lump sum or next month)
    console.log('\\n[5] Testing Take Fee for next months...');
    const takeFeeRes = await axios.post(`${BASE_URL}/api/fees/collect`, {
      student_id: 'TEST-999',
      amount: 3000,
      discount: 0,
      months: ['May'],
      payment_mode: 'Cash',
      notes: 'API Test Payment'
    });
    console.log(`✅ Take Fee successful. Receipt: ${takeFeeRes.data.receipt_no}`);

    // 6. Print Receipt Endpoint
    console.log('\\n[6] Testing Fetch Receipt for Printing...');
    const receiptRes = await axios.get(`${BASE_URL}/api/fees/receipt/${takeFeeRes.data.receipt_no}`);
    console.log(`✅ Receipt data fetched successfully for ${takeFeeRes.data.receipt_no}`);

    // 7. Cleanup
    console.log('\\n[7] Cleaning up Test Data...');
    await axios.delete(`${BASE_URL}/api/students/adm/TEST-999`);
    console.log('✅ Student TEST-999 and related data deleted successfully');

    console.log('\\n--- All API Tests Passed Successfully! ---');

  } catch (error) {
    console.error('\\n❌ Test Failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message);
    }
  }
}

runTests();
