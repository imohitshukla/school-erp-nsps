const db = require('../db');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');

/**
 * GET /api/students/classes
 * Returns all distinct class names in the students table.
 */
exports.getClasses = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT class_name FROM students WHERE school_id = $1 ORDER BY class_name ASC',
      [req.user.school_id]
    );
    res.status(200).json({ data: result.rows.map(r => r.class_name) });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const result = await db.query(
      'SELECT id, adm_no, name, class_name FROM students WHERE class_name = $1 AND school_id = $2 ORDER BY name ASC',
      [className, req.user.school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getStudentByAdmNo = async (req, res) => {
  try {
    const { admNo } = req.params;
    const { academicYear } = req.query;
    
    let query = 'SELECT id, adm_no, name, father_name, gender, class_name, payable_fee, transport_fee, paid_past, concession FROM students WHERE adm_no = $1 AND school_id = $2';
    const params = [admNo, req.user.school_id];

    if (academicYear) {
      query += ' AND academic_year = $3';
      params.push(academicYear);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = result.rows[0];

    // Also fetch monthly dues for this student
    const year = academicYear || '2026-2027';
    const duesResult = await db.query(
      `SELECT * FROM student_monthly_dues 
       WHERE student_adm_no = $1 AND school_id = $2 AND academic_year = $3
       ORDER BY month_index ASC`,
      [admNo, req.user.school_id, year]
    );

    let monthlyDues = duesResult.rows;

    const totalDue = monthlyDues.reduce((sum, m) => sum + parseFloat(m.tuition_due || 0) + parseFloat(m.transport_due || 0) + parseFloat(m.other_due || 0) + parseFloat(m.id_card_due || 0) + parseFloat(m.admission_fee_due || 0) - parseFloat(m.concession || 0), 0);
    const totalPaid = monthlyDues.reduce((sum, m) => sum + parseFloat(m.tuition_paid || 0) + parseFloat(m.transport_paid || 0) + parseFloat(m.other_paid || 0) + parseFloat(m.id_card_paid || 0) + parseFloat(m.admission_fee_paid || 0), 0);

    res.status(200).json({
      data: {
        ...student,
        monthly_dues: monthlyDues,
        total_annual_due: totalDue,
        total_annual_paid: totalPaid,
        total_balance: totalDue - totalPaid,
      }
    });
  } catch (error) {
    console.error('Error fetching student by adm_no:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.searchStudents = async (req, res) => {
  try {
    const { q, academicYear } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    let query = `
      SELECT id, adm_no, name, father_name, gender, class_name 
      FROM students 
      WHERE (adm_no ILIKE $1 OR name ILIKE $1) AND school_id = $2
    `;
    const params = [`%${q}%`, req.user.school_id];

    if (academicYear) {
      query += ' AND academic_year = $3';
      params.push(academicYear);
    }
    query += ' ORDER BY name ASC LIMIT 10';

    const result = await db.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getStudentStats = async (req, res) => {
  try {
    const totalResult = await db.query('SELECT COUNT(*) as total FROM students WHERE school_id = $1', [req.user.school_id]);
    const totalStudents = parseInt(totalResult.rows[0].total) || 0;

    const classStatsResult = await db.query(`
      SELECT class_name, COUNT(*) as count 
      FROM students 
      WHERE school_id = $1
      GROUP BY class_name 
      ORDER BY class_name
    `, [req.user.school_id]);

    const genderStatsResult = await db.query(`
      SELECT 
        SUM(CASE WHEN LOWER(gender) IN ('male', 'm', 'boy') THEN 1 ELSE 0 END) as total_male,
        SUM(CASE WHEN LOWER(gender) IN ('female', 'f', 'girl') THEN 1 ELSE 0 END) as total_female,
        SUM(CASE WHEN transport_fee > 0 THEN 1 ELSE 0 END) as total_transport

      FROM students 
      WHERE school_id = $1
    `, [req.user.school_id]);

    const statsRow = genderStatsResult.rows[0];
    const totalMale = parseInt(statsRow.total_male) || 0;
    const totalFemale = parseInt(statsRow.total_female) || 0;
    const totalTransport = parseInt(statsRow.total_transport) || 0;
    const totalActive = parseInt(totalStudents) || 0;
    const totalInactive = 0;

    res.status(200).json({
      data: {
        totalActive,
        totalInactive,
        totalOld: 0,
        totalNew: totalStudents, // default to new for now
        totalMale,
        totalFemale,
        totalTransport,
        totalBoarding: 0,
        classStats: classStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { class_name, academic_year } = req.query;
    let query = 'SELECT id, adm_no, name, father_name, gender, class_name, payable_fee, transport_fee, paid_past, concession, academic_year FROM students WHERE school_id = $1';
    const params = [req.user.school_id];

    if (class_name) {
      params.push(class_name);
      query += ` AND class_name = $${params.length}`;
    }
    if (academic_year) {
      params.push(academic_year);
      query += ` AND academic_year = $${params.length}`;
    }

    query += ' ORDER BY name ASC';
    const result = await db.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createStudent = async (req, res) => {
  const { adm_no, name, father_name, gender, class_name, academic_year, payable_fee, transport_fee, concession } = req.body;
  if (!adm_no || !name || !class_name) {
    return res.status(400).json({ error: 'adm_no, name, and class_name are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO students (adm_no, name, father_name, gender, class_name, academic_year, school_id, payable_fee, transport_fee, concession)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (school_id, adm_no, academic_year) DO UPDATE
       SET name = EXCLUDED.name, father_name = EXCLUDED.father_name, gender = EXCLUDED.gender, class_name = EXCLUDED.class_name,
           payable_fee = EXCLUDED.payable_fee, transport_fee = EXCLUDED.transport_fee,
           concession = EXCLUDED.concession
       RETURNING *`,
      [adm_no, name, father_name || null, gender || null, class_name, academic_year || '2026-2027', req.user.school_id,
       parseFloat(payable_fee || 0), parseFloat(transport_fee || 0), parseFloat(concession || 0)]
    );
    res.status(201).json({ message: 'Student admitted successfully', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A student with this Admission Number already exists for this academic year.' });
    }
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * Normalize a header string for flexible matching.
 */
function normalizeHeader(h) {
  return (h || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Map raw header names to canonical field names.
 * Returns { adm_no, name, class_name } indices/keys.
 */
function detectColumns(headers) {
  const norm = headers.map(normalizeHeader);
  const find = (...variants) => norm.findIndex(h => variants.some(v => h.includes(v)));

  const admIdx   = find('admno', 'adm', 'admission', 'rollno', 'roll');
  const nameIdx  = find('name', 'studentname', 'fullname');
  const classIdx = find('class', 'classname', 'grade', 'std', 'standard');
  const fatherIdx = find('father', 'fathername', 'parentname');
  const genderIdx = find('gender', 'sex', 'm/f', 'boy/girl');

  return { admIdx, nameIdx, classIdx, fatherIdx, genderIdx };
}

/**
 * Parse rows from an XLSX/XLS workbook buffer.
 * Scans all rows to find the actual header row (skips preamble rows
 * like school name/title that appear before the real headers).
 * Returns array of plain objects keyed by detected headers.
 */
function parseXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Get all rows as raw arrays (no header assumption)
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rawRows.length === 0) return [];

  // Find the header row — the first row that contains 'adm' or 'name'
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i].map(c => (c || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const hasAdm  = row.some(c => c.includes('adm') || c.includes('rollno') || c.includes('admission'));
    const hasName = row.some(c => c === 'name' || c.includes('studentname') || c.includes('fullname'));
    if (hasAdm || hasName) {
      headerRowIdx = i;
      break;
    }
  }

  // Fall back to row 0 if no header row found
  if (headerRowIdx === -1) headerRowIdx = 0;

  const headers = rawRows[headerRowIdx].map(c => (c || '').toString().trim());

  // Build objects from all rows after the header row
  const dataRows = rawRows.slice(headerRowIdx + 1);
  return dataRows
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (row[i] === undefined ? '' : row[i]); });
      return obj;
    })
    .filter(row => Object.values(row).some(v => (v || '').toString().trim() !== ''));
}

exports.importStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const academicYear = req.body.academicYear || '2026-2027';
  const errors = [];
  let inserted = 0;

  try {
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    let rows = []; // array of plain objects { header: value }

    if (ext === '.xlsx' || ext === '.xls') {
      // ── XLSX / XLS path ──────────────────────────────────────────────
      const buffer = fs.readFileSync(req.file.path);
      rows = parseXlsx(buffer);
    } else {
      // ── CSV path ─────────────────────────────────────────────────────
      rows = await new Promise((resolve, reject) => {
        const collected = [];
        fs.createReadStream(req.file.path)
          .pipe(csv()) // csv-parser uses first row as headers automatically
          .on('data', d => collected.push(d))
          .on('end', () => resolve(collected))
          .on('error', reject);
      });
    }

    // Clean up temp file immediately
    fs.unlinkSync(req.file.path);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'File is empty or could not be parsed.' });
    }

    // Detect columns from the first row's keys
    const headers = Object.keys(rows[0]);
    const { admIdx, nameIdx, classIdx, fatherIdx, genderIdx } = detectColumns(headers);

    if (admIdx === -1 || nameIdx === -1) {
      return res.status(400).json({
        error: `Could not find required columns. Found: [${headers.join(', ')}]. Need a column for Admission No and Name.`
      });
    }

    const admKey   = headers[admIdx];
    const nameKey  = headers[nameIdx];
    const classKey = classIdx !== -1 ? headers[classIdx] : null;
    const fatherKey = fatherIdx !== -1 ? headers[fatherIdx] : null;
    const genderKey = genderIdx !== -1 ? headers[genderIdx] : null;

    for (const row of rows) {
      const admNo      = (row[admKey]   || '').toString().trim();
      const studentName = (row[nameKey] || '').toString().trim();
      const className  = classKey ? (row[classKey] || '').toString().trim() : 'Unknown';
      const fatherName = fatherKey ? (row[fatherKey] || '').toString().trim() : null;
      let genderStr = genderKey ? (row[genderKey] || '').toString().trim() : null;
      
      // Normalize gender if present
      if (genderStr) {
        if (genderStr.toLowerCase().startsWith('m')) genderStr = 'Male';
        else if (genderStr.toLowerCase().startsWith('f')) genderStr = 'Female';
      }

      if (!admNo || !studentName) continue; // skip blank rows

      try {
        await db.query(
          `INSERT INTO students (adm_no, name, father_name, gender, class_name, academic_year, school_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (school_id, adm_no, academic_year) DO UPDATE
           SET name = EXCLUDED.name, father_name = EXCLUDED.father_name, gender = EXCLUDED.gender, class_name = EXCLUDED.class_name`,
          [admNo, studentName, fatherName, genderStr, className || 'Unknown', academicYear, req.user.school_id]
        );

        // Auto-apply fee template if one exists for this class
        const tplRes = await db.query(
          `SELECT tuition_fee, transport_fee, other_fee FROM class_fee_templates 
           WHERE class_name = $1 AND academic_year = $2 AND school_id = $3`,
          [className, academicYear, req.user.school_id]
        );
        if (tplRes.rows.length > 0) {
          const tpl = tplRes.rows[0];
          const MONTH_NAMES = ['April','May','June','July','August','September','October','November','December','January','February','March'];
          const mTuition = Math.round((parseFloat(tpl.tuition_fee || 0) / 12) * 100) / 100;
          const mTransport = Math.round((parseFloat(tpl.transport_fee || 0) / 12) * 100) / 100;
          const mOther = Math.round((parseFloat(tpl.other_fee || 0) / 12) * 100) / 100;

          for (let idx = 0; idx < 12; idx++) {
            await db.query(
              `INSERT INTO student_monthly_dues 
                (student_adm_no, month_name, month_index, tuition_due, transport_due, other_due, concession, academic_year, school_id)
               VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
               ON CONFLICT (student_adm_no, month_name, academic_year, school_id) DO NOTHING`,
              [admNo, MONTH_NAMES[idx], idx + 1, mTuition, mTransport, mOther, academicYear, req.user.school_id]
            );
          }

          await db.query(
            `UPDATE students SET payable_fee = $1, transport_fee = $2 WHERE adm_no = $3 AND school_id = $4 AND academic_year = $5`,
            [tpl.tuition_fee, tpl.transport_fee, admNo, req.user.school_id, academicYear]
          );
        }

        inserted++;
      } catch (dbErr) {
        errors.push(`Row [${admNo}]: ${dbErr.message}`);
      }
    }

    res.status(200).json({
      message: `Student import completed. ${inserted} record(s) saved.`,
      insertedCount: inserted,
      errors,
    });
  } catch (err) {
    // Attempt cleanup on unexpected errors
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
    console.error('Error importing students:', err);
    res.status(500).json({ error: 'Internal server error during import.' });
  }
};

/**
 * GET /api/students/export
 * Streams all students for this school as a downloadable CSV.
 */
exports.exportStudents = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT adm_no, name, father_name, gender, class_name, academic_year,
              payable_fee, transport_fee, paid_past, concession
       FROM students
       WHERE school_id = $1
       ORDER BY class_name, name ASC`,
      [req.user.school_id]
    );

    const rows = result.rows;
    const headers = ['adm_no', 'name', 'father_name', 'gender', 'class_name', 'academic_year',
                     'payable_fee', 'transport_fee', 'paid_past', 'concession'];

    const csvLines = [
      headers.join(','),
      ...rows.map(r =>
        headers.map(h => {
          const val = (r[h] === null || r[h] === undefined) ? '' : String(r[h]);
          // Escape commas / quotes
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',')
      )
    ];

    const csvContent = csvLines.join('\n');
    const filename = `students_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting students:', error);
    res.status(500).json({ error: 'Internal server error during export' });
  }
};

/**
 * GET /api/students/template
 * Returns a blank CSV template with the correct headers for student import.
 */
exports.downloadStudentTemplate = (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['adm_no', 'name', 'class_name'],
      ['B001', 'John Doe', '10th'],
      ['B002', 'Jane Smith', 'LKG'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.xlsx"');
    return res.status(200).send(buf);
  }

  // Default: CSV
  const csvContent = 'adm_no,name,father_name,gender,class_name\nB001,John Doe,Richard Doe,Male,10th\nB002,Jane Smith,Will Smith,Female,LKG\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.csv"');
  res.status(200).send(csvContent);
};
