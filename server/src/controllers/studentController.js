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
    
    let query = 'SELECT id, adm_no, name, class_name, payable_fee, transport_fee, paid_past, concession FROM students WHERE adm_no = $1 AND school_id = $2';
    const params = [admNo, req.user.school_id];

    if (academicYear) {
      query += ' AND academic_year = $3';
      params.push(academicYear);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching student by adm_no:', error);
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

    res.status(200).json({
      data: {
        totalActive: totalStudents,
        totalOld: 0,
        totalMale: 0,
        totalFemale: 0,
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
    let query = 'SELECT id, adm_no, name, class_name, payable_fee, transport_fee, paid_past, concession, academic_year FROM students WHERE school_id = $1';
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
  const { adm_no, name, class_name, academic_year, payable_fee, transport_fee, concession } = req.body;
  if (!adm_no || !name || !class_name) {
    return res.status(400).json({ error: 'adm_no, name, and class_name are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO students (adm_no, name, class_name, academic_year, school_id, payable_fee, transport_fee, concession)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (school_id, adm_no, academic_year) DO UPDATE
       SET name = EXCLUDED.name, class_name = EXCLUDED.class_name,
           payable_fee = EXCLUDED.payable_fee, transport_fee = EXCLUDED.transport_fee,
           concession = EXCLUDED.concession
       RETURNING *`,
      [adm_no, name, class_name, academic_year || '2026-2027', req.user.school_id,
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

  return { admIdx, nameIdx, classIdx };
}

/**
 * Parse rows from an XLSX/XLS workbook buffer.
 * Returns array of plain objects keyed by first-row headers.
 */
function parseXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // sheet_to_json with defval '' to avoid undefined cells
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
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
    const { admIdx, nameIdx, classIdx } = detectColumns(headers);

    if (admIdx === -1 || nameIdx === -1) {
      return res.status(400).json({
        error: `Could not find required columns. Found: [${headers.join(', ')}]. Need a column for Admission No and Name.`
      });
    }

    const admKey   = headers[admIdx];
    const nameKey  = headers[nameIdx];
    const classKey = classIdx !== -1 ? headers[classIdx] : null;

    for (const row of rows) {
      const admNo      = (row[admKey]   || '').toString().trim();
      const studentName = (row[nameKey] || '').toString().trim();
      const className  = classKey ? (row[classKey] || '').toString().trim() : 'Unknown';

      if (!admNo || !studentName) continue; // skip blank rows

      try {
        await db.query(
          `INSERT INTO students (adm_no, name, class_name, academic_year, school_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (school_id, adm_no, academic_year) DO UPDATE
           SET name = EXCLUDED.name, class_name = EXCLUDED.class_name`,
          [admNo, studentName, className || 'Unknown', academicYear, req.user.school_id]
        );
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
      `SELECT adm_no, name, class_name, academic_year,
              payable_fee, transport_fee, paid_past, concession
       FROM students
       WHERE school_id = $1
       ORDER BY class_name, name ASC`,
      [req.user.school_id]
    );

    const rows = result.rows;
    const headers = ['adm_no', 'name', 'class_name', 'academic_year',
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
  const csvContent = 'adm_no,name,class_name\nB001,John Doe,10th\nB002,Jane Smith,LKG\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.csv"');
  res.status(200).send(csvContent);
};
