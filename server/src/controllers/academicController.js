const db = require('../db');
const logger = require('../utils/logger');

exports.getExam = async (req, res) => {
  const { className, term, subject } = req.query;
  try {
    const result = await db.query(
      `SELECT * FROM exams 
       WHERE school_id = $1 AND class_name = $2 AND term = $3 AND subject = $4`,
      [req.user.school_id, className, term, subject]
    );
    res.status(200).json({ data: result.rows[0] || null });
  } catch (error) {
    logger.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createExam = async (req, res) => {
  const { className, term, subject, maxMarks } = req.body;
  if (!className || !term || !subject || !maxMarks) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const result = await db.query(
      `INSERT INTO exams (school_id, class_name, term, subject, max_marks)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.school_id, className, term, subject, parseFloat(maxMarks)]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    logger.error('Error creating exam:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMarks = async (req, res) => {
  const { examId } = req.params;
  try {
    const result = await db.query(
      `SELECT m.*, s.name as student_name 
       FROM marks m
       JOIN students s ON m.student_adm_no = s.adm_no AND m.school_id = s.school_id
       WHERE m.exam_id = $1 AND m.school_id = $2`,
      [examId, req.user.school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.saveMarks = async (req, res) => {
  const { examId, marks } = req.body; // marks is an array of { student_adm_no, score }
  
  if (!examId || !Array.isArray(marks)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const mark of marks) {
      if (mark.score === '' || mark.score === null || mark.score === undefined) {
         // Optionally delete or ignore empty scores
         await client.query(
           `DELETE FROM marks WHERE exam_id = $1 AND student_adm_no = $2 AND school_id = $3`,
           [examId, mark.student_adm_no, req.user.school_id]
         );
         continue;
      }

      await client.query(
        `INSERT INTO marks (school_id, exam_id, student_adm_no, score)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (exam_id, student_adm_no) 
         DO UPDATE SET score = EXCLUDED.score`,
        [req.user.school_id, examId, mark.student_adm_no, parseFloat(mark.score)]
      );
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'Marks saved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error saving marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
