const db = require('../db');
const logger = require('../utils/logger');

// ======================= CREATE / UPDATE EXAM SCHEDULE =======================

exports.createSchedule = async (req, res) => {
  const { class_name, exam_type, academic_year, note_english, note_hindi, subjects } = req.body;

  if (!class_name || !exam_type || !academic_year || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ error: 'class_name, exam_type, academic_year, and subjects[] are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert the schedule header
    const scheduleRes = await client.query(
      `INSERT INTO exam_schedules (school_id, class_name, exam_type, academic_year, note_english, note_hindi, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (school_id, class_name, exam_type, academic_year)
       DO UPDATE SET note_english = EXCLUDED.note_english, note_hindi = EXCLUDED.note_hindi, updated_at = NOW()
       RETURNING *`,
      [req.user.school_id, class_name, exam_type, academic_year, note_english || '', note_hindi || '']
    );
    const schedule = scheduleRes.rows[0];

    // Delete old subjects for this schedule and re-insert
    await client.query('DELETE FROM exam_schedule_subjects WHERE schedule_id = $1', [schedule.id]);

    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i];
      if (!s.subject || !s.exam_date || !s.start_time || !s.end_time) continue;
      await client.query(
        `INSERT INTO exam_schedule_subjects (schedule_id, serial_no, subject, exam_date, start_time, end_time, room_no)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [schedule.id, i + 1, s.subject, s.exam_date, s.start_time, s.end_time, s.room_no || '']
      );
    }

    await client.query('COMMIT');

    // Return full schedule with subjects
    const subjectsRes = await db.query(
      'SELECT * FROM exam_schedule_subjects WHERE schedule_id = $1 ORDER BY serial_no',
      [schedule.id]
    );

    res.status(201).json({
      message: 'Exam schedule saved successfully',
      data: { ...schedule, subjects: subjectsRes.rows }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating exam schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// ======================= LIST SCHEDULES =======================

exports.getSchedules = async (req, res) => {
  const { class_name, exam_type, academic_year } = req.query;
  try {
    let query = `SELECT es.*, 
                   (SELECT COUNT(*) FROM exam_schedule_subjects WHERE schedule_id = es.id) AS subject_count
                 FROM exam_schedules es
                 WHERE es.school_id = $1`;
    const params = [req.user.school_id];

    if (class_name) {
      params.push(class_name);
      query += ` AND es.class_name = $${params.length}`;
    }
    if (exam_type) {
      params.push(exam_type);
      query += ` AND es.exam_type = $${params.length}`;
    }
    if (academic_year) {
      params.push(academic_year);
      query += ` AND es.academic_year = $${params.length}`;
    }

    query += ' ORDER BY es.updated_at DESC';
    const result = await db.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching exam schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ======================= GET SINGLE SCHEDULE =======================

exports.getScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    const scheduleRes = await db.query(
      'SELECT * FROM exam_schedules WHERE id = $1 AND school_id = $2',
      [id, req.user.school_id]
    );
    if (scheduleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    const schedule = scheduleRes.rows[0];

    const subjectsRes = await db.query(
      'SELECT * FROM exam_schedule_subjects WHERE schedule_id = $1 ORDER BY serial_no',
      [schedule.id]
    );

    res.status(200).json({ data: { ...schedule, subjects: subjectsRes.rows } });
  } catch (error) {
    logger.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ======================= GENERATE ADMIT CARDS =======================

exports.generateAdmitCards = async (req, res) => {
  const { scheduleId } = req.params;
  try {
    // Get the schedule
    const scheduleRes = await db.query(
      'SELECT * FROM exam_schedules WHERE id = $1 AND school_id = $2',
      [scheduleId, req.user.school_id]
    );
    if (scheduleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    const schedule = scheduleRes.rows[0];

    // Get subjects
    const subjectsRes = await db.query(
      'SELECT * FROM exam_schedule_subjects WHERE schedule_id = $1 ORDER BY serial_no',
      [schedule.id]
    );

    // Get students for that class
    const studentsRes = await db.query(
      `SELECT id, adm_no, name, father_name, class_name, section
       FROM students 
       WHERE class_name = $1 AND school_id = $2
       ORDER BY name ASC`,
      [schedule.class_name, req.user.school_id]
    );

    // Get school name
    const schoolRes = await db.query('SELECT name FROM schools WHERE id = $1', [req.user.school_id]);
    const schoolName = schoolRes.rows.length > 0 ? schoolRes.rows[0].name : 'School';

    res.status(200).json({
      data: {
        school_name: schoolName,
        schedule: { ...schedule, subjects: subjectsRes.rows },
        students: studentsRes.rows,
        total_students: studentsRes.rows.length
      }
    });
  } catch (error) {
    logger.error('Error generating admit cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ======================= DELETE SCHEDULE =======================

exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM exam_schedules WHERE id = $1 AND school_id = $2 RETURNING *',
      [id, req.user.school_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    logger.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
