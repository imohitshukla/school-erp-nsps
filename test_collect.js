const db = require('./server/src/db');
const { collectFee } = require('./server/src/controllers/feeController');

async function run() {
  const req = {
    body: {
      student_id: '33',
      amount: 2600,
      payment_mode: 'Cash',
      months: ['April Fee'], // wait! monthName is 'April Fee' not 'April'!
      discount: 0,
      notes: 'test',
    },
    user: { school_id: 1, username: 'admin' },
  };
  
  const res = {
    status: (code) => ({
      json: (data) => console.log('STATUS', code, data),
    }),
    json: (data) => console.log('SUCCESS', data),
  };

  await collectFee(req, res);
  process.exit(0);
}

run();
