const db = require('../db');
const logger = require('../utils/logger');

/**
 * POST /api/fees/collect
 * Collects a fee payment for a student identified by adm_no.
 */
exports.collectFee = async (req, res) => {
  const { student_id, amount, payment_mode, notes, receipt_no: schoolReceiptNo, tuition_amount, transport_amount, month_paid } = req.body;

  if (!student_id || !amount || !payment_mode) {
    return res.status(400).json({ error: 'Missing required fields: student_id, amount, payment_mode' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  try {
    // Verify student exists
    const studentResult = await db.query('SELECT id, name, adm_no, class_name FROM students WHERE adm_no = $1 AND school_id = $2', [student_id, req.user.school_id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: `Student with adm_no "${student_id}" not found in this school` });
    }

    const student = studentResult.rows[0];
    const receiptNo = schoolReceiptNo || `REC-${Date.now()}`;
    const collectedBy = req.user?.username || 'admin';

    const ledgerResult = await db.query(
      `INSERT INTO fee_ledger 
         (receipt_no, student_id, amount, payment_mode, transaction_reference, collected_by, status, notes, school_id, tuition_amount, transport_amount, month_paid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [receiptNo, student.adm_no, parsedAmount, payment_mode, `TXN-${Date.now()}`, collectedBy, 'Success', notes || '', req.user.school_id, parseFloat(tuition_amount || 0), parseFloat(transport_amount || 0), month_paid || null]
    );

    // Update the student's paid_past
    await db.query(
      `UPDATE students SET paid_past = COALESCE(paid_past, 0) + $1 WHERE adm_no = $2 AND school_id = $3`,
      [parsedAmount, student.adm_no, req.user.school_id]
    );

    res.status(201).json({
      message: 'Fee collected successfully',
      data: {
        ...ledgerResult.rows[0],
        student_name: student.name,
        adm_no: student.adm_no,
        class_name: student.class_name,
      },
    });
  } catch (error) {
    logger.error('Error collecting fee:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Receipt number already exists. Please use a different one.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/fees/daily-collection
 * Supports optional query params: startDate, endDate, class, mode
 */
exports.getDailyCollection = async (req, res) => {
  const { startDate, endDate, class: classFilter, mode: modeFilter } = req.query;

  try {
    let query = `
      SELECT 
        l.receipt_no,
        l.student_id       AS adm_no,
        COALESCE(s.name, 'Unknown Student') AS student_name,
        COALESCE(s.class_name, 'N/A')       AS class,
        l.amount           AS pay_amt,
        l.payment_mode     AS mode,
        l.notes,
        l.created_at       AS date_and_time,
        l.collected_by     AS taken_by
      FROM fee_ledger l
      LEFT JOIN students s ON s.adm_no = l.student_id AND s.school_id = l.school_id
      WHERE l.status = 'Success' AND l.school_id = $1
    `;

    const params = [req.user.school_id];

    if (startDate) {
      params.push(startDate);
      query += ` AND l.created_at >= $${params.length}::date`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND l.created_at < ($${params.length}::date + INTERVAL '1 day')`;
    }
    if (classFilter && classFilter !== 'All') {
      params.push(classFilter);
      query += ` AND s.class_name = $${params.length}`;
    }
    if (modeFilter && modeFilter !== 'All') {
      params.push(modeFilter);
      query += ` AND l.payment_mode = $${params.length}`;
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await db.query(query, params);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching daily collection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { parseCSVDate } = require('../utils/dateParser');

function normalizeKey(h) {
  return (h || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

exports.importFees = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const academicYear = req.body.academicYear || '2026-2027';
  const errors = [];
  let inserted = 0;

  try {
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    let rows = [];

    if (ext === '.xlsx' || ext === '.xls') {
      const buffer = fs.readFileSync(req.file.path);
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Get raw rows (no header assumption)
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      // Find the header row — look for 'adm' in first 10 rows
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i].map(c => (c || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (row.some(c => c.includes('adm') || c.includes('rollno') || c.includes('admission'))) {
          headerRowIdx = i;
          break;
        }
      }
      const headers = rawRows[headerRowIdx].map(c => (c || '').toString().trim());
      rows = rawRows.slice(headerRowIdx + 1)
        .map(row => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = (row[i] === undefined ? '' : row[i]); });
          return obj;
        })
        .filter(row => Object.values(row).some(v => (v || '').toString().trim() !== ''));

    } else {
      rows = await new Promise((resolve, reject) => {
        const collected = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', d => collected.push(d))
          .on('end', () => resolve(collected))
          .on('error', reject);
      });
    }

    fs.unlinkSync(req.file.path);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'File is empty or could not be parsed.' });
    }

    // Map headers flexibly
    const headers = Object.keys(rows[0]);
    const norm = headers.map(normalizeKey);
    const find = (...vs) => norm.findIndex(h => vs.some(v => h.includes(v)));

    const admKey        = headers[find('admno', 'adm', 'admission', 'rollno')];
    const payableKey    = headers[find('totalamount', 'payable', 'tuition', 'fees')];
    const transportKey  = headers[find('transport')];
    const paidKey       = headers[find('totalpaid', 'paid')];
    const concessionKey = headers[find('concession', 'discount')];
    const modeKey       = headers[find('paymentmode', 'mode')];
    const dateKey       = headers[find('paymentdate', 'date')];
    const receiptKey    = headers[find('transactionid', 'receipt', 'txn')];

    if (!admKey) {
      return res.status(400).json({
        error: `Could not find admission number column. Found: [${headers.join(', ')}]`
      });
    }

    for (const row of rows) {
      const admNo = (row[admKey] || '').toString().trim();
      if (!admNo) continue;

      const payableFee   = parseFloat(row[payableKey]   || 0) || 0;
      const transportFee = parseFloat(row[transportKey] || 0) || 0;
      const paidPast     = parseFloat(row[paidKey]      || 0) || 0;
      const concession   = parseFloat(row[concessionKey]|| 0) || 0;
      const paymentMode  = (row[modeKey] || 'Cash').toString().trim() || 'Cash';
      const rawDate      = dateKey ? row[dateKey] : null;
      const receiptNo    = (row[receiptKey] || '').toString().trim()
                          || `FEE-IMP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

      try {
        // Step 1: update student fee structure and get student DB id
        const updateResult = await db.query(
          `UPDATE students
           SET payable_fee = $1, transport_fee = $2, concession = $3
           WHERE adm_no = $4 AND school_id = $5 AND academic_year = $6
           RETURNING id`,
          [payableFee, transportFee, concession, admNo, req.user.school_id, academicYear]
        );

        if (updateResult.rows.length === 0) {
          errors.push(`${admNo}: student not found for year ${academicYear}. Import students first.`);
          continue;
        }

        const studentDbId = updateResult.rows[0].id;

        // Step 2: log past payment in ledger if paidPast > 0
        if (paidPast > 0) {
          const parsedDate = parseCSVDate(rawDate);
          await db.query(
            `INSERT INTO fee_ledger
               (student_id, receipt_no, amount, payment_mode, notes, collected_by, created_at, school_id, fee_head_id, concession)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT DO NOTHING`,
            [
              studentDbId, receiptNo, paidPast, paymentMode,
              'Imported from file', 'Admin', parsedDate,
              req.user.school_id, 1, concession
            ]
          );
        }

        inserted++;
      } catch (dbErr) {
        errors.push(`Row [${admNo}]: ${dbErr.message}`);
      }
    }

    res.status(200).json({
      message: `Fee import completed. ${inserted} record(s) updated.`,
      insertedCount: inserted,
      errors,
    });
  } catch (err) {
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
    console.error('Error importing fees:', err);
    res.status(500).json({ error: 'Internal server error during fee import.' });
  }
};


// --- FEE DASHBOARD STATS ---
exports.getFeeDashboardStats = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    // Note: To filter session properly, we would pass academicYear in query and join students table, 
    // but for now we'll do global or simple date filters based on fee_ledger.

    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const monthStr = firstDayOfMonth.toISOString().split('T')[0];

    // 1. Today Collection
    const todayRes = await db.query(
      `SELECT SUM(amount) as total FROM fee_ledger 
       WHERE school_id = $1 AND DATE(created_at) = $2 AND status != 'Cancelled'`,
      [schoolId, todayStr]
    );
    const todayCollection = parseFloat(todayRes.rows[0].total || 0);

    // 2. Current Month Collection
    const monthRes = await db.query(
      `SELECT SUM(amount) as total FROM fee_ledger 
       WHERE school_id = $1 AND DATE(created_at) >= $2 AND status != 'Cancelled'`,
      [schoolId, monthStr]
    );
    const monthCollection = parseFloat(monthRes.rows[0].total || 0);

    // 3. Session Collection & Total Discount
    // We sum all time amounts for simplicity if academicYear is not strictly joined
    const sessionRes = await db.query(
      `SELECT SUM(amount) as total, SUM(concession) as discount FROM fee_ledger 
       WHERE school_id = $1 AND status != 'Cancelled'`,
      [schoolId]
    );
    const sessionCollection = parseFloat(sessionRes.rows[0].total || 0);
    const totalDiscount = parseFloat(sessionRes.rows[0].discount || 0);

    // 4. Month-wise collection (Current year)
    const monthWiseRes = await db.query(
      `SELECT to_char(created_at, 'Mon') as name, SUM(amount) as amount
       FROM fee_ledger
       WHERE school_id = $1 AND status != 'Cancelled'
       GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at)
       ORDER BY date_trunc('month', created_at) LIMIT 12`,
      [schoolId]
    );
    const monthWiseData = monthWiseRes.rows.map(r => ({ name: r.name, amount: parseFloat(r.amount || 0) }));

    // 5. Last 10 days collection
    const last10DaysRes = await db.query(
      `SELECT to_char(created_at, 'DD-Mon') as name, SUM(amount) as amount
       FROM fee_ledger
       WHERE school_id = $1 AND status != 'Cancelled' AND created_at >= current_date - interval '10 days'
       GROUP BY to_char(created_at, 'DD-Mon'), DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [schoolId]
    );
    const last10DaysData = last10DaysRes.rows.map(r => ({ name: r.name, amount: parseFloat(r.amount || 0) }));

    // 6. Today head wise collection
    const headWiseRes = await db.query(
      `SELECT fh.name, SUM(fl.amount) as amount
       FROM fee_ledger fl
       LEFT JOIN fee_heads fh ON fl.fee_head_id = fh.id
       WHERE fl.school_id = $1 AND DATE(fl.created_at) = $2 AND fl.status != 'Cancelled'
       GROUP BY fh.name`,
      [schoolId, todayStr]
    );
    let headWiseData = headWiseRes.rows.map(r => ({ name: r.name || 'General Fee', amount: parseFloat(r.amount || 0) }));
    if (headWiseData.length === 0) {
       headWiseData = [{ name: 'General Fee', amount: 0 }]; // Fallback
    }

    res.status(200).json({
      success: true,
      data: {
        todayCollection,
        monthCollection,
        sessionCollection,
        totalDiscount,
        monthWiseData,
        last10DaysData,
        headWiseData
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// --- FEE REPORTING ENGINE ENDPOINTS ---
/**
 * 1. Daily Collection Report
 * GET /api/fees/reports/daily?date=YYYY-MM-DD
 */
exports.getDailyCollectionReport = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });

  try {
    const result = await db.query(
      `SELECT payment_mode, SUM(amount) as total_sum, json_agg(
          json_build_object('receipt_no', receipt_no, 'amount', amount, 'student_id', student_id, 'created_at', created_at)
       ) as transactions
       FROM fee_ledger
       WHERE school_id = $1 AND created_at::date = $2
       GROUP BY payment_mode`,
      [req.user.school_id, date]
    );

    let totalCollection = 0;
    result.rows.forEach(r => totalCollection += parseFloat(r.total_sum || 0));

    res.status(200).json({
      date,
      totalCollection,
      breakdown: result.rows
    });
  } catch (error) {
    logger.error('Error in daily collection report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 2. Custom Date Range
 * GET /api/fees/reports/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
exports.getCustomDateRangeReport = async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date are required' });

  try {
    // Total amounts
    const sumResult = await db.query(
      `SELECT SUM(amount) as total_collected, SUM(concession) as total_concession
       FROM fee_ledger
       WHERE school_id = $1 AND created_at::date BETWEEN $2 AND $3`,
      [req.user.school_id, start_date, end_date]
    );

    // Array of receipts
    const receiptsResult = await db.query(
      `SELECT receipt_no, student_id, amount, concession, payment_mode, created_at
       FROM fee_ledger
       WHERE school_id = $1 AND created_at::date BETWEEN $2 AND $3
       ORDER BY created_at DESC`,
      [req.user.school_id, start_date, end_date]
    );

    res.status(200).json({
      startDate: start_date,
      endDate: end_date,
      totalCollected: parseFloat(sumResult.rows[0].total_collected || 0),
      totalConcessions: parseFloat(sumResult.rows[0].total_concession || 0),
      receipts: receiptsResult.rows
    });
  } catch (error) {
    logger.error('Error in custom date range report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 3. Month-Wise Summaries
 * GET /api/fees/reports/monthly
 */
exports.getMonthWiseSummary = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS total_collected
       FROM fee_ledger
       WHERE school_id = $1
       GROUP BY month
       ORDER BY month ASC`,
      [req.user.school_id]
    );

    res.status(200).json({
      data: result.rows.map(r => ({
        month: r.month,
        totalCollected: parseFloat(r.total_collected || 0)
      }))
    });
  } catch (error) {
    logger.error('Error in month-wise summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 4. Category & Head-Wise Breakdown
 * GET /api/fees/reports/category?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
exports.getCategoryWiseBreakdown = async (req, res) => {
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT h.id as category_id, h.name as category_name, SUM(l.amount) as total_amount
      FROM fee_ledger l
      JOIN fee_heads h ON l.fee_head_id = h.id
      WHERE l.school_id = $1
    `;
    const params = [req.user.school_id];

    if (start_date && end_date) {
      query += ` AND l.created_at::date BETWEEN $2 AND $3`;
      params.push(start_date, end_date);
    }

    query += ` GROUP BY h.id, h.name ORDER BY h.id ASC`;

    const result = await db.query(query, params);

    res.status(200).json({
      startDate: start_date || 'All Time',
      endDate: end_date || 'All Time',
      breakdown: result.rows.map(r => ({
        categoryId: r.category_id,
        categoryName: r.category_name,
        totalAmount: parseFloat(r.total_amount || 0)
      }))
    });
  } catch (error) {
    logger.error('Error in category-wise breakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 5. Due Balance & Defaulter Forecasting
 * GET /api/fees/reports/defaulters
 */
exports.getDefaulterForecasting = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         adm_no, 
         name, 
         class_name, 
         payable_fee as total_assigned, 
         paid_past as total_collected,
         (payable_fee - paid_past - concession) as pending_balance
       FROM students
       WHERE school_id = $1 AND (payable_fee - paid_past - concession) > 0
       ORDER BY pending_balance DESC`,
      [req.user.school_id]
    );

    res.status(200).json({
      defaulterCount: result.rows.length,
      defaulters: result.rows.map(r => ({
        ...r,
        total_assigned: parseFloat(r.total_assigned || 0),
        total_collected: parseFloat(r.total_collected || 0),
        pending_balance: parseFloat(r.pending_balance || 0)
      }))
    });
  } catch (error) {
    logger.error('Error in defaulter forecasting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================================================
// EXPORT ENDPOINTS
// =============================================================================

/**
 * Utility: convert an array of row objects to CSV string
 */
function rowsToCSV(rows, headers) {
  if (!rows || rows.length === 0) return headers.join(',') + '\n';
  const lines = [headers.join(',')];
  for (const row of rows) {
    const cols = headers.map(h => {
      const val = (row[h] === null || row[h] === undefined) ? '' : String(row[h]);
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    });
    lines.push(cols.join(','));
  }
  return lines.join('\n');
}

/**
 * GET /api/fees/export/ledger?startDate=&endDate=
 * Exports the fee_ledger as a downloadable CSV.
 */
exports.exportFeeLedger = async (req, res) => {
  const { startDate, endDate, class: classFilter, mode: modeFilter } = req.query;
  try {
    let query = `
      SELECT 
        l.receipt_no,
        l.student_id AS adm_no,
        COALESCE(s.name, 'Unknown') AS student_name,
        COALESCE(s.class_name, 'N/A') AS class_name,
        l.amount AS amount,
        l.payment_mode AS payment_mode,
        l.collected_by,
        l.notes,
        l.created_at AS date_time,
        l.status
      FROM fee_ledger l
      LEFT JOIN students s ON s.adm_no = l.student_id AND s.school_id = l.school_id
      WHERE l.school_id = $1
    `;
    const params = [req.user.school_id];

    if (startDate) { params.push(startDate); query += ` AND l.created_at >= $${params.length}::date`; }
    if (endDate)   { params.push(endDate);   query += ` AND l.created_at < ($${params.length}::date + INTERVAL '1 day')`; }
    if (classFilter && classFilter !== 'All') { params.push(classFilter); query += ` AND s.class_name = $${params.length}`; }
    if (modeFilter  && modeFilter  !== 'All') { params.push(modeFilter);  query += ` AND l.payment_mode = $${params.length}`; }

    query += ' ORDER BY l.created_at DESC';

    const result = await db.query(query, params);
    const headers = ['receipt_no','adm_no','student_name','class_name','amount','payment_mode','collected_by','notes','date_time','status'];
    const csv = rowsToCSV(result.rows, headers);

    const filename = `fee_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    logger.error('Error exporting fee ledger:', error);
    res.status(500).json({ error: 'Internal server error during export' });
  }
};

/**
 * GET /api/fees/export/defaulters
 * Exports the defaulters list as a downloadable CSV.
 */
exports.exportDefaulters = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         adm_no, name, class_name,
         payable_fee   AS total_assigned,
         paid_past     AS total_paid,
         concession,
         (payable_fee - paid_past - concession) AS pending_balance
       FROM students
       WHERE school_id = $1 AND (payable_fee - paid_past - concession) > 0
       ORDER BY pending_balance DESC`,
      [req.user.school_id]
    );

    const headers = ['adm_no','name','class_name','total_assigned','total_paid','concession','pending_balance'];
    const csv = rowsToCSV(result.rows, headers);

    const filename = `defaulters_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    logger.error('Error exporting defaulters:', error);
    res.status(500).json({ error: 'Internal server error during export' });
  }
};

/**
 * GET /api/fees/template
 * Returns a blank CSV template with the correct headers for fee import.
 */
exports.downloadFeeTemplate = (req, res) => {
  const csv = [
    'adm_no,total_amount,transport_fee,total_paid,concession,payment_mode,payment_date,transaction_id',
    'B001,25000,3000,10000,500,Cash,01-Apr-2026,',
    'B002,25000,0,25000,1000,UPI,15-Apr-2026,TXN-98765',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fee_import_template.csv"');
  res.status(200).send(csv);
};
