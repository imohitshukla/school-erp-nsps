const db = require('../db');
const logger = require('../utils/logger');

/**
 * POST /api/fees/collect
 * Collects fee for one or more months.
 * Body: { student_id (adm_no), months: ['April','May'], tuition_amount, transport_amount, payment_mode, notes, receipt_no }
 */
exports.collectFee = async (req, res) => {
  const { student_id, amount, payment_mode, notes, receipt_no: schoolReceiptNo, months, discount } = req.body;

  if (!student_id || !payment_mode || !months || !Array.isArray(months) || months.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: student_id, payment_mode, months (array)' });
  }

  let remainingAmount = parseFloat(amount);
  if (isNaN(remainingAmount) || remainingAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const studentResult = await client.query('SELECT id, name, adm_no, class_name FROM students WHERE adm_no = $1 AND school_id = $2', [student_id, req.user.school_id]);
    if (studentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Student with adm_no "${student_id}" not found in this school` });
    }
    const student = studentResult.rows[0];
    const receiptNo = schoolReceiptNo || `REC-${Date.now()}`;
    const collectedBy = req.user?.username || 'admin';

    // Fetch the dues for all requested months
    const duesRes = await client.query(
      `SELECT * FROM student_monthly_dues WHERE student_adm_no = $1 AND month_name = ANY($2) AND school_id = $3 AND academic_year = '2026-2027' ORDER BY month_index ASC`,
      [student.adm_no, months, req.user.school_id]
    );

    if (duesRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Fee records not found.` });
    }

    let discountRemaining = parseFloat(discount || 0);
    let totalTuitionPaid = 0;
    let totalTransportPaid = 0;
    const monthsCoveredArr = [];

    // Process each month sequentially
    for (const dueRecord of duesRes.rows) {
      if (remainingAmount <= 0 && discountRemaining <= 0) break;

      monthsCoveredArr.push(dueRecord.month_name);

      let payTuition = 0, payTransport = 0, payOther = 0;
      let payAdmission = 0, payAnnual = 0, payIdCard = 0, payExam = 0;
      let applyDiscount = 0;

      // Helper to distribute amount for this specific month
      const applyToBucket = (due, paid) => {
        const remainingDue = Math.max(0, parseFloat(due || 0) - parseFloat(paid || 0));
        const pay = Math.min(remainingAmount, remainingDue);
        remainingAmount -= pay;
        return pay;
      };

      if (dueRecord.is_one_time) {
        payAdmission = applyToBucket(dueRecord.admission_fee_due, dueRecord.admission_fee_paid);
        payAnnual = applyToBucket(dueRecord.annual_fee_due, dueRecord.annual_fee_paid);
        payIdCard = applyToBucket(dueRecord.id_card_due, dueRecord.id_card_paid);
        payExam = applyToBucket(dueRecord.exam_fee_due, dueRecord.exam_fee_paid);
        payOther = applyToBucket(dueRecord.other_due, dueRecord.other_paid);
      } else {
        payTuition = applyToBucket(dueRecord.tuition_due, dueRecord.tuition_paid);
        payTransport = applyToBucket(dueRecord.transport_due, dueRecord.transport_paid);
        payOther = applyToBucket(dueRecord.other_due, dueRecord.other_paid);
      }

      totalTuitionPaid += payTuition;
      totalTransportPaid += payTransport;

      // Apply discount to this month if needed
      const totalDueThisMonth = parseFloat(dueRecord.tuition_due) + parseFloat(dueRecord.transport_due) + parseFloat(dueRecord.other_due) + parseFloat(dueRecord.admission_fee_due) + parseFloat(dueRecord.annual_fee_due) + parseFloat(dueRecord.id_card_due) + parseFloat(dueRecord.exam_fee_due);
      const totalPaidThisMonth = parseFloat(dueRecord.tuition_paid) + parseFloat(dueRecord.transport_paid) + parseFloat(dueRecord.other_paid) + parseFloat(dueRecord.admission_fee_paid) + parseFloat(dueRecord.annual_fee_paid) + parseFloat(dueRecord.id_card_paid) + parseFloat(dueRecord.exam_fee_paid) + parseFloat(dueRecord.concession);
      const netDue = Math.max(0, totalDueThisMonth - totalPaidThisMonth - (payTuition + payTransport + payOther + payAdmission + payAnnual + payIdCard + payExam));
      
      if (discountRemaining > 0 && netDue > 0) {
        applyDiscount = Math.min(discountRemaining, netDue);
        discountRemaining -= applyDiscount;
      }

      await client.query(
        `UPDATE student_monthly_dues
         SET tuition_paid = tuition_paid + $1,
             transport_paid = transport_paid + $2,
             other_paid = other_paid + $3,
             admission_fee_paid = admission_fee_paid + $4,
             annual_fee_paid = annual_fee_paid + $5,
             id_card_paid = id_card_paid + $6,
             exam_fee_paid = exam_fee_paid + $7,
             concession = concession + $8,
             status = CASE
               WHEN (tuition_paid + $1 + transport_paid + $2 + other_paid + $3 + admission_fee_paid + $4 + annual_fee_paid + $5 + id_card_paid + $6 + exam_fee_paid + $7) >= 
                    (tuition_due + transport_due + other_due + admission_fee_due + annual_fee_due + id_card_due + exam_fee_due - (concession + $8)) THEN 'PAID'
               WHEN (tuition_paid + $1 + transport_paid + $2 + other_paid + $3 + admission_fee_paid + $4 + annual_fee_paid + $5 + id_card_paid + $6 + exam_fee_paid + $7) > 0 THEN 'PARTIAL'
               ELSE status
             END,
             paid_at = NOW(),
             receipt_no = $9
         WHERE id = $10`,
        [payTuition, payTransport, payOther, payAdmission, payAnnual, payIdCard, payExam, applyDiscount, receiptNo, dueRecord.id]
      );
    }

    const monthsCoveredStr = monthsCoveredArr.join(', ');

    // Ledger Entry
    const ledgerResult = await client.query(
      `INSERT INTO fee_ledger 
         (receipt_no, student_id, amount, payment_mode, transaction_reference, collected_by, status, notes, school_id, tuition_amount, transport_amount, month_paid, months_covered) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [receiptNo, student.adm_no, amount, payment_mode, `TXN-${Date.now()}`, collectedBy, 'Success', notes || '', req.user.school_id, totalTuitionPaid, totalTransportPaid, monthsCoveredArr[0] || '', monthsCoveredStr]
    );

    // Update the student's flat paid_past
    await client.query(
      `UPDATE students SET paid_past = COALESCE(paid_past, 0) + $1 WHERE adm_no = $2 AND school_id = $3`,
      [amount, student.adm_no, req.user.school_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Fee collected successfully',
      data: {
        ...ledgerResult.rows[0],
        student_name: student.name,
        adm_no: student.adm_no,
        class_name: student.class_name,
        months_paid: monthsCoveredStr,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error collecting fee:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Receipt number already exists. Please use a different one.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};


/**
 * GET /api/fees/daily-collection
 * Supports optional query params: startDate, endDate, class, mode
 */
exports.getDailyCollection = async (req, res) => {
  const { startDate, endDate, class: classFilter, mode: modeFilter } = req.query;

  try {
    // Dual-JOIN: s1 = exact match, s2 = fallback for plain-numeric adm_no imports
    // (e.g. fee_ledger.student_id = '4453' but students.adm_no = '4453Ns')
    let query = `
      SELECT 
        l.id,
        l.receipt_no,
        l.student_id                                                AS adm_no,
        COALESCE(s1.name, s2.name, 'Unknown Student')               AS student_name,
        COALESCE(s1.class_name, s2.class_name, 'N/A')               AS class,
        l.amount                                                    AS pay_amt,
        COALESCE(l.tuition_amount, 0)                               AS tuition_amount,
        COALESCE(l.transport_amount, 0)                             AS transport_amount,
        COALESCE(l.concession, 0)                                   AS concession,
        l.payment_mode                                              AS mode,
        l.billing_month,
        l.months_covered,
        l.notes,
        l.created_at                                                AS date_and_time,
        l.collected_by                                              AS taken_by,
        l.status
      FROM fee_ledger l
      LEFT JOIN students s1
        ON s1.adm_no = l.student_id AND s1.school_id = l.school_id
      LEFT JOIN students s2
        ON s2.adm_no = (l.student_id || 'Ns') AND s2.school_id = l.school_id
        AND s1.adm_no IS NULL
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
      // Filter on either join path
      query += ` AND (s1.class_name = $${params.length} OR s2.class_name = $${params.length})`;
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

    // Fetch all students into memory to avoid per-row DB lookups
    const allStudentsRes = await db.query(
      `SELECT id, adm_no FROM students WHERE school_id = $1 AND academic_year = $2`,
      [req.user.school_id, academicYear]
    );
    
    const studentMap = {};
    const studentMapNs = {};
    allStudentsRes.rows.forEach(s => {
      const lowerAdm = (s.adm_no || '').toString().trim().toLowerCase();
      studentMap[lowerAdm] = s;
      if (lowerAdm.endsWith('ns')) {
        studentMapNs[lowerAdm.replace('ns', '')] = s;
      }
    });

    // We will aggregate everything to prevent duplicates which crash UNNEST queries
    const studentUpdateMap = {}; // id -> { pf, tf, c }
    const duesInsertMap = {};    // admNo_month -> { adm, month, idx, tDue, pDue, conc, yr, sch }
    const duesUpdateMap = {};    // admNo_month -> { tp, pp, rec }
    const bLedger = { stId: [], rec: [], amt: [], mode: [], note: [], by: [], date: [], sch: [], head: [], conc: [] };

    const MONTH_NAMES = [
      'April', 'May', 'June', 'July', 'August', 'September', 
      'October', 'November', 'December', 'January', 'February', 'March'
    ];

    for (const row of rows) {
      let rawAdmNo = (row[admKey] || '').toString().trim();
      if (!rawAdmNo) continue;
      
      const lookupAdm = rawAdmNo.toLowerCase();
      let student = studentMap[lookupAdm];
      if (!student && /^\d+$/.test(lookupAdm) && studentMapNs[lookupAdm]) {
        student = studentMapNs[lookupAdm]; // resolve Ns fallback
      }

      const payableFee   = parseFloat(row[payableKey]   || 0) || 0;
      const transportFee = parseFloat(row[transportKey] || 0) || 0;
      const paidPast     = parseFloat(row[paidKey]      || 0) || 0;
      const concession   = parseFloat(row[concessionKey]|| 0) || 0;
      const paymentMode  = (row[modeKey] || 'Cash').toString().trim() || 'Cash';
      const rawDate      = dateKey ? row[dateKey] : null;
      const parsedDate   = parseCSVDate(rawDate);
      const receiptNo    = (row[receiptKey] || '').toString().trim()
                          || `FEE-IMP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

      if (!student) {
        // Unlinked payment
        if (paidPast > 0) {
          bLedger.stId.push(rawAdmNo); // store raw adm as string ID
          bLedger.rec.push(receiptNo);
          bLedger.amt.push(paidPast);
          bLedger.mode.push(paymentMode);
          bLedger.note.push('Imported from file — unlinked (student not found)');
          bLedger.by.push('Admin');
          bLedger.date.push(parsedDate);
          bLedger.sch.push(req.user.school_id);
          bLedger.head.push(1);
          bLedger.conc.push(concession);
          inserted++;
        }
        errors.push(`${rawAdmNo}: student not found — payment logged as unlinked.`);
        continue;
      }

      // Valid student
      const admNo = student.adm_no;
      
      // Keep last seen fee structure
      studentUpdateMap[student.id] = { pFee: payableFee, tFee: transportFee, conc: concession };

      const mTuition = Math.round((payableFee / 12) * 100) / 100;
      const mTransport = Math.round((transportFee / 12) * 100) / 100;
      const mConcession = Math.round((concession / 12) * 100) / 100;
      const mNetDue = mTuition + mTransport - mConcession;

      // Ensure 12 month entries exist for this student
      for (let idx = 0; idx < 12; idx++) {
        const monthName = MONTH_NAMES[idx];
        const key = `${admNo}_${monthName}`;
        if (!duesInsertMap[key]) {
          duesInsertMap[key] = {
            adm: admNo, month: monthName, idx: idx + 1,
            tDue: mTuition, pDue: mTransport, conc: mConcession,
            yr: academicYear, sch: req.user.school_id
          };
        }
      }

      if (paidPast > 0) {
        bLedger.stId.push(student.id.toString());
        bLedger.rec.push(receiptNo);
        bLedger.amt.push(paidPast);
        bLedger.mode.push(paymentMode);
        bLedger.note.push('Imported from file');
        bLedger.by.push('Admin');
        bLedger.date.push(parsedDate);
        bLedger.sch.push(req.user.school_id);
        bLedger.head.push(1);
        bLedger.conc.push(concession);

        let remainingPayment = paidPast;
        for (let idx = 0; idx < 12; idx++) {
          if (remainingPayment <= 0) break;
          const monthName = MONTH_NAMES[idx];
          const key = `${admNo}_${monthName}`;

          const payForThisMonth = Math.min(remainingPayment, mNetDue > 0 ? mNetDue : 0);
          if (payForThisMonth > 0) {
            const tuitionPortion = mTuition > 0 ? Math.min(payForThisMonth, mTuition) : 0;
            const transportPortion = Math.max(0, payForThisMonth - tuitionPortion);

            if (!duesUpdateMap[key]) {
               duesUpdateMap[key] = { tp: 0, pp: 0, rec: receiptNo };
            }
            duesUpdateMap[key].tp += tuitionPortion;
            duesUpdateMap[key].pp += transportPortion;
            duesUpdateMap[key].rec = receiptNo;

            remainingPayment -= payForThisMonth;
          }
        }
      }
      inserted++;
    }

    // Convert aggregated maps to bulk arrays
    const bStu = { id: [], pFee: [], tFee: [], conc: [] };
    for (const [id, data] of Object.entries(studentUpdateMap)) {
      bStu.id.push(id); bStu.pFee.push(data.pFee); bStu.tFee.push(data.tFee); bStu.conc.push(data.conc);
    }

    const bDuesIn = { adm: [], month: [], idx: [], tDue: [], pDue: [], conc: [], yr: [], sch: [] };
    for (const data of Object.values(duesInsertMap)) {
      bDuesIn.adm.push(data.adm); bDuesIn.month.push(data.month); bDuesIn.idx.push(data.idx);
      bDuesIn.tDue.push(data.tDue); bDuesIn.pDue.push(data.pDue); bDuesIn.conc.push(data.conc);
      bDuesIn.yr.push(data.yr); bDuesIn.sch.push(data.sch);
    }

    const bDuesUp = { adm: [], month: [], tPaid: [], pPaid: [], rec: [], sch: [], yr: [] };
    for (const [key, data] of Object.entries(duesUpdateMap)) {
      const [adm, month] = key.split('_');
      bDuesUp.adm.push(adm); bDuesUp.month.push(month);
      bDuesUp.tPaid.push(data.tp); bDuesUp.pPaid.push(data.pp); bDuesUp.rec.push(data.rec);
      bDuesUp.sch.push(req.user.school_id); bDuesUp.yr.push(academicYear);
    }

    // Execute bulk queries using UNNEST
    if (bStu.id.length > 0) {
      await db.query(`
        UPDATE students SET payable_fee = u.pf, transport_fee = u.tf, concession = u.c
        FROM UNNEST($1::integer[], $2::numeric[], $3::numeric[], $4::numeric[]) AS u(id, pf, tf, c)
        WHERE students.id = u.id
      `, [bStu.id, bStu.pFee, bStu.tFee, bStu.conc]);
    }

    if (bDuesIn.adm.length > 0) {
      await db.query(`
        INSERT INTO student_monthly_dues (student_adm_no, month_name, month_index, tuition_due, transport_due, other_due, concession, academic_year, school_id)
        SELECT * FROM UNNEST($1::text[], $2::text[], $3::integer[], $4::numeric[], $5::numeric[], $6::numeric[], $7::numeric[], $8::text[], $9::integer[])
        ON CONFLICT (student_adm_no, month_name, academic_year, school_id)
        DO UPDATE SET
          tuition_due = EXCLUDED.tuition_due,
          transport_due = EXCLUDED.transport_due,
          concession = EXCLUDED.concession
      `, [bDuesIn.adm, bDuesIn.month, bDuesIn.idx, bDuesIn.tDue, bDuesIn.pDue, Array(bDuesIn.adm.length).fill(0), bDuesIn.conc, bDuesIn.yr, bDuesIn.sch]);
    }

    if (bLedger.stId.length > 0) {
      await db.query(`
        INSERT INTO fee_ledger (student_id, receipt_no, amount, payment_mode, notes, collected_by, created_at, school_id, fee_head_id, concession)
        SELECT * FROM UNNEST($1::text[], $2::text[], $3::numeric[], $4::text[], $5::text[], $6::text[], $7::timestamptz[], $8::integer[], $9::integer[], $10::numeric[])
        ON CONFLICT DO NOTHING
      `, [bLedger.stId, bLedger.rec, bLedger.amt, bLedger.mode, bLedger.note, bLedger.by, bLedger.date, bLedger.sch, bLedger.head, bLedger.conc]);
    }

    if (bDuesUp.adm.length > 0) {
      await db.query(`
        UPDATE student_monthly_dues
        SET tuition_paid = LEAST(tuition_due, tuition_paid + u.tp),
            transport_paid = LEAST(transport_due, transport_paid + u.pp),
            status = CASE
              WHEN (tuition_paid + u.tp + transport_paid + u.pp) >= (tuition_due + transport_due - concession) THEN 'PAID'
              WHEN (tuition_paid + u.tp + transport_paid + u.pp) > 0 THEN 'PARTIAL'
              ELSE status
            END,
            paid_at = NOW(),
            receipt_no = u.rec
        FROM UNNEST($1::text[], $2::text[], $3::numeric[], $4::numeric[], $5::text[], $6::integer[], $7::text[]) AS u(adm, month, tp, pp, rec, sch, yr)
        WHERE student_monthly_dues.student_adm_no = u.adm
          AND student_monthly_dues.month_name = u.month
          AND student_monthly_dues.school_id = u.sch
          AND student_monthly_dues.academic_year = u.yr
      `, [bDuesUp.adm, bDuesUp.month, bDuesUp.tPaid, bDuesUp.pPaid, bDuesUp.rec, bDuesUp.sch, bDuesUp.yr]);
    }

    res.status(200).json({
      message: `Fee import completed. ${inserted} record(s) updated.`,
      insertedCount: inserted,
      errors,
    });
  } catch (err) {
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
    console.error('Error importing fees:', err);
    res.status(500).json({ error: 'Internal server error during fee import: ' + err.message });
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
        l.amount AS total_amount,
        l.tuition_amount,
        l.transport_amount,
        l.id_card_amount,
        l.admission_amount,
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
    const headers = ['receipt_no','adm_no','student_name','class_name','total_amount','tuition_amount','transport_amount','id_card_amount','admission_amount','payment_mode','collected_by','notes','date_time','status'];
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

// =============================================================================
// MANUAL FEE ENTRY — Admin backdates historical payments
// POST /api/fees/manual-entry
// =============================================================================

/**
 * POST /api/fees/manual-entry
 * Allows admin to manually enter / backfill a historical fee payment.
 * Body: {
 *   admission_number, billing_month, payment_date, tuition_amount,
 *   transport_amount, payment_mode, receipt_no (optional), notes
 * }
 */
exports.manualFeeEntry = async (req, res) => {
  const {
    admission_number,
    billing_month,
    payment_date,
    tuition_amount,
    transport_amount,
    id_card_amount,
    admission_amount,
    payment_mode,
    receipt_no: providedReceiptNo,
    notes,
  } = req.body;

  if (!admission_number || !billing_month || !payment_date || !payment_mode) {
    return res.status(400).json({
      error: 'Missing required fields: admission_number, billing_month, payment_date, payment_mode',
    });
  }

  const parsedTuition   = parseFloat(tuition_amount   || 0) || 0;
  const parsedTransport = parseFloat(transport_amount || 0) || 0;
  const parsedIdCard    = parseFloat(id_card_amount || 0) || 0;
  const parsedAdmission = parseFloat(admission_amount || 0) || 0;
  const totalAmount     = parsedTuition + parsedTransport + parsedIdCard + parsedAdmission;

  if (totalAmount <= 0) {
    return res.status(400).json({ error: 'Total amount must be greater than zero.' });
  }

  // Validate payment_date
  const payDate = new Date(payment_date);
  if (isNaN(payDate.getTime())) {
    return res.status(400).json({ error: 'Invalid payment_date format. Use YYYY-MM-DD.' });
  }

  try {
    // 1. Resolve student
    let studentResult = await db.query(
      `SELECT id, name, adm_no, class_name FROM students WHERE adm_no = $1 AND school_id = $2`,
      [admission_number, req.user.school_id]
    );
    // Fallback: try Ns suffix if plain numeric
    if (studentResult.rows.length === 0 && /^\d+$/.test(admission_number)) {
      studentResult = await db.query(
        `SELECT id, name, adm_no, class_name FROM students WHERE adm_no = $1 AND school_id = $2`,
        [admission_number + 'Ns', req.user.school_id]
      );
    }
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: `Student "${admission_number}" not found.` });
    }

    const student     = studentResult.rows[0];
    const receiptNo   = providedReceiptNo?.trim() || `MAN-${Date.now()}`;
    const academicYear = req.query.academicYear || '2026-2027';
    const collectedBy = req.user?.username || 'admin';

    const MONTH_INDEX = {
      'April':1,'May':2,'June':3,'July':4,'August':5,'September':6,
      'October':7,'November':8,'December':9,'January':10,'February':11,'March':12,
    };
    const mIdx = MONTH_INDEX[billing_month];
    if (!mIdx) {
      return res.status(400).json({ error: `Invalid billing_month: "${billing_month}". Use full English month name.` });
    }

    // 2. Upsert monthly dues row so the charge baseline exists
    await db.query(
      `INSERT INTO student_monthly_dues
         (student_adm_no, month_name, month_index, tuition_due, transport_due, id_card_due, admission_fee_due,
          tuition_paid, transport_paid, id_card_paid, admission_fee_paid, status, academic_year, school_id, paid_at, receipt_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $4, $5, $6, $7, 'PAID', $8, $9, $10, $11)
       ON CONFLICT (student_adm_no, month_name, academic_year, school_id)
       DO UPDATE SET
         tuition_paid   = LEAST(student_monthly_dues.tuition_due,
                                student_monthly_dues.tuition_paid + $4),
         transport_paid = LEAST(student_monthly_dues.transport_due,
                                student_monthly_dues.transport_paid + $5),
         id_card_paid   = LEAST(student_monthly_dues.id_card_due,
                                student_monthly_dues.id_card_paid + $6),
         admission_fee_paid = LEAST(student_monthly_dues.admission_fee_due,
                                student_monthly_dues.admission_fee_paid + $7),
         status = CASE
           WHEN (student_monthly_dues.tuition_paid + $4 + student_monthly_dues.transport_paid + $5 + student_monthly_dues.id_card_paid + $6 + student_monthly_dues.admission_fee_paid + $7)
                 >= (student_monthly_dues.tuition_due + student_monthly_dues.transport_due + student_monthly_dues.id_card_due + student_monthly_dues.admission_fee_due
                     - student_monthly_dues.concession)
           THEN 'PAID'
           WHEN (student_monthly_dues.tuition_paid + $4 + student_monthly_dues.transport_paid + $5 + student_monthly_dues.id_card_paid + $6 + student_monthly_dues.admission_fee_paid + $7) > 0
           THEN 'PARTIAL'
           ELSE student_monthly_dues.status
         END,
         paid_at   = $10,
         receipt_no = $11`,
      [
        student.adm_no, billing_month, mIdx,
        parsedTuition, parsedTransport, parsedIdCard, parsedAdmission,
        academicYear, req.user.school_id, payDate, receiptNo,
      ]
    );

    // 3. Insert into fee_ledger with the backdated payment_date
    const ledgerResult = await db.query(
      `INSERT INTO fee_ledger
         (receipt_no, student_id, amount, payment_mode, collected_by, status, notes,
          school_id, fee_head_id, concession, tuition_amount, transport_amount,
          id_card_amount, admission_amount, billing_month, created_at)
       VALUES ($1, $2, $3, $4, $5, 'Success', $6, $7, 1, 0, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (receipt_no) DO NOTHING
       RETURNING *`,
      [
        receiptNo, student.adm_no, totalAmount, payment_mode, collectedBy,
        notes || `Manual entry — ${billing_month}`,
        req.user.school_id, parsedTuition, parsedTransport, parsedIdCard, parsedAdmission, billing_month, payDate,
      ]
    );

    // 4. Fetch updated monthly dues for this student
    const duesResult = await db.query(
      `SELECT month_name, month_index, tuition_due, transport_due, id_card_due, admission_fee_due, concession,
              tuition_paid, transport_paid, id_card_paid, admission_fee_paid, status
       FROM student_monthly_dues
       WHERE student_adm_no = $1 AND school_id = $2 AND academic_year = $3
       ORDER BY month_index ASC`,
      [student.adm_no, req.user.school_id, academicYear]
    );

    res.status(201).json({
      success: true,
      message: `Payment of ₹${totalAmount} recorded for ${student.name} — ${billing_month}`,
      receipt_no: receiptNo,
      student: { name: student.name, adm_no: student.adm_no, class_name: student.class_name },
      ledger: ledgerResult.rows[0] || null,
      monthly_dues: duesResult.rows,
    });
  } catch (error) {
    logger.error('Error in manual fee entry:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Receipt number already exists. Use a different one.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


// =============================================================================
// GENERATE MONTHLY CHARGES (Cron-ready)
// POST /api/fees/generate-monthly
// =============================================================================

/**
 * POST /api/fees/generate-monthly
 * Reads class_fee_templates and inserts student_monthly_dues rows for every
 * active student for the given month. Safe to run multiple times (ON CONFLICT DO NOTHING).
 * Body: { billing_month (optional, defaults to current month), academic_year (optional) }
 */
exports.generateMonthlyCharges = async (req, res) => {
  const academicYear = req.body?.academic_year || req.query?.academic_year || '2026-2027';

  const MONTH_NAMES = [
    'April','May','June','July','August','September',
    'October','November','December','January','February','March',
  ];
  const MONTH_INDEX = {};
  MONTH_NAMES.forEach((m, i) => { MONTH_INDEX[m] = i + 1; });

  // Default to current calendar month mapped to school year
  let billing_month = req.body?.billing_month || req.query?.billing_month;
  if (!billing_month) {
    const now = new Date();
    billing_month = now.toLocaleString('en-US', { month: 'long' }); // e.g. 'August'
  }
  const mIdx = MONTH_INDEX[billing_month];
  if (!mIdx) {
    return res.status(400).json({ error: `Invalid billing_month: "${billing_month}"` });
  }

  try {
    // Get all active students with their class fee template
    const studentsResult = await db.query(
      `SELECT s.adm_no, s.class_name, s.school_id,
              COALESCE(t.tuition_fee / 12, 0)   AS monthly_tuition,
              COALESCE(t.transport_fee / 12, 0) AS monthly_transport,
              COALESCE(t.other_fee / 12, 0)     AS monthly_other
       FROM students s
       LEFT JOIN class_fee_templates t
         ON t.class_name = s.class_name
         AND t.academic_year = $1
         AND t.school_id = s.school_id
       WHERE s.school_id = $2 AND s.academic_year = $1`,
      [academicYear, req.user.school_id]
    );

    if (studentsResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No students found for this school/year.',
        created: 0,
      });
    }

    let created = 0;
    let skipped = 0;

    for (const stu of studentsResult.rows) {
      const mTuition   = Math.round(parseFloat(stu.monthly_tuition)   * 100) / 100;
      const mTransport = Math.round(parseFloat(stu.monthly_transport) * 100) / 100;
      const mOther     = Math.round(parseFloat(stu.monthly_other)     * 100) / 100;

      const insertResult = await db.query(
        `INSERT INTO student_monthly_dues
           (student_adm_no, month_name, month_index, tuition_due, transport_due,
            other_due, concession, status, academic_year, school_id)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 'UNPAID', $7, $8)
         ON CONFLICT (student_adm_no, month_name, academic_year, school_id) DO NOTHING`,
        [stu.adm_no, billing_month, mIdx, mTuition, mTransport, mOther, academicYear, stu.school_id]
      );
      if (insertResult.rowCount > 0) created++;
      else skipped++;
    }

    res.status(201).json({
      success: true,
      message: `Monthly charges generated for ${billing_month} ${academicYear}`,
      billing_month,
      academic_year: academicYear,
      total_students: studentsResult.rows.length,
      created,
      skipped_existing: skipped,
    });
  } catch (error) {
    logger.error('Error generating monthly charges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/fees/receipt/:receiptNo
 * Fetches the full details of a receipt
 */
exports.getReceipt = async (req, res) => {
  const { receiptNo } = req.params;
  try {
    // We do a join with students to get student details
    const result = await db.query(`
      SELECT l.*, s.name as student_name, s.class_name, s.father_name
      FROM fee_ledger l
      LEFT JOIN students s ON l.student_id = s.adm_no AND l.school_id = s.school_id
      WHERE l.receipt_no = $1 AND l.school_id = $2
    `, [receiptNo, req.user.school_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    logger.error('Error fetching receipt:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
