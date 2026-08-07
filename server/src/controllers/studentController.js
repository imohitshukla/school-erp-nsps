const db = require('../db');
const fs = require('fs');
const csv = require('csv-parser');

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
        totalOld: Math.floor(totalStudents * 0.4), // Mocked for demo
        totalMale: Math.floor(totalStudents * 0.6), // Mocked for demo
        totalFemale: Math.floor(totalStudents * 0.4), // Mocked for demo
        classStats: classStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.importStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const academicYear = req.body.academicYear || '2026-2027';
  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv({ headers: false })) // Do not assume first row is header
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        let inserted = 0;
        let headerMap = null;

        for (const row of results) {
          // If we haven't found the header row yet, look for it
          if (!headerMap) {
            const rowValues = Object.values(row).map(v => (v || '').toString().trim().toLowerCase());
            // Check if this row looks like the header row (contains adm and name/class)
            const admIndex = rowValues.findIndex(v => v.includes('adm') || v === 'admissionnumber');
            const nameIndex = rowValues.findIndex(v => v === 'name' || v === 'studentname' || v === 'student name');
            const classIndex = rowValues.findIndex(v => v === 'class' || v === 'classname' || v === 'class name');
            
            if (admIndex !== -1 && nameIndex !== -1) {
              headerMap = {
                admNo: admIndex,
                name: nameIndex,
                className: classIndex !== -1 ? classIndex : -1,
              };
            }
            continue; // Skip the header row itself, and any preamble rows
          }

          // We have a header map, so process this as a data row
          const admNo = row[headerMap.admNo];
          const studentName = row[headerMap.name];
          const className = headerMap.className !== -1 ? row[headerMap.className] : 'Unknown';
          
          if (!admNo || !studentName) {
            continue; // Skip empty rows at the end of the file
          }

          try {
            await db.query(
              `INSERT INTO students (adm_no, name, class_name, academic_year, school_id) 
               VALUES ($1, $2, $3, $4, $5) 
               ON CONFLICT (school_id, adm_no, academic_year) DO UPDATE 
               SET name = EXCLUDED.name, 
                   class_name = EXCLUDED.class_name`,
              [admNo, studentName, className, academicYear, req.user.school_id]
            );
            
            inserted++;
          } catch (dbErr) {
            errors.push(`DB Error on row ${admNo}: ${dbErr.message}`);
          }
        }

        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);

        if (!headerMap) {
          errors.push("Could not find a valid header row containing 'Adm.No.' and 'Name'.");
        } else if (inserted === 0 && errors.length > 0) {
           console.error('Import validation errors:', errors.slice(0, 5));
        }

        res.status(200).json({ 
          message: 'Student Import completed', 
          insertedCount: inserted,
          errors 
        });
      } catch (err) {
        console.error('Error importing students:', err);
        res.status(500).json({ error: 'Internal server error during import' });
      }
    });
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
  const csv = 'adm_no,name,class_name\nB001,John Doe,10th\nB002,Jane Smith,LKG\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.csv"');
  res.status(200).send(csv);
};
