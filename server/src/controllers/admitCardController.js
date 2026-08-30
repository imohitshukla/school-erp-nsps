const db = require('../db');
const logger = require('../utils/logger');

// ======================= AUTO-MIGRATE (Self-Healing) =======================
let migrated = false;
const ensureTables = async () => {
  if (migrated) return;
  try {
    // 1. Create exam schedules & subjects tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS exam_schedules (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        exam_type VARCHAR(50) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        note_english TEXT DEFAULT '',
        note_hindi TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(school_id, class_name, exam_type, academic_year)
      );
      CREATE TABLE IF NOT EXISTS exam_schedule_subjects (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
        serial_no INTEGER NOT NULL,
        subject VARCHAR(100) NOT NULL,
        exam_date DATE NOT NULL,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        room_no VARCHAR(20) DEFAULT '',
        UNIQUE(schedule_id, serial_no)
      );
      CREATE INDEX IF NOT EXISTS idx_es_school ON exam_schedules (school_id, academic_year);
      CREATE INDEX IF NOT EXISTS idx_ess_sched ON exam_schedule_subjects (schedule_id);
    `);

    // 2. Safely ensure students table has father_name and section columns
    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='section') THEN
          ALTER TABLE students ADD COLUMN section VARCHAR(10);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='father_name') THEN
          ALTER TABLE students ADD COLUMN father_name VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='photo_url') THEN
          ALTER TABLE students ADD COLUMN photo_url VARCHAR(500);
        END IF;
      END $$;
    `);

    migrated = true;
    logger.info('Admit card tables and schema verified.');
  } catch (err) {
    logger.error('Auto-migrate admit card tables failed:', err.message);
    migrated = true;
  }
};

// ======================= CREATE / UPDATE EXAM SCHEDULE =======================

exports.createSchedule = async (req, res) => {
  await ensureTables();
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
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    client.release();
  }
};

// ======================= LIST SCHEDULES =======================

exports.getSchedules = async (req, res) => {
  await ensureTables();
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
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ======================= GET SINGLE SCHEDULE =======================

exports.getScheduleById = async (req, res) => {
  await ensureTables();
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
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ======================= GENERATE ADMIT CARDS =======================

exports.generateAdmitCards = async (req, res) => {
  await ensureTables();
  const { scheduleId } = req.params;
  try {
    // 1. Get the exam schedule
    const scheduleRes = await db.query(
      'SELECT * FROM exam_schedules WHERE id = $1 AND school_id = $2',
      [scheduleId, req.user.school_id]
    );
    if (scheduleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Exam schedule not found' });
    }
    const schedule = scheduleRes.rows[0];

    // 2. Get the subjects list for this schedule
    const subjectsRes = await db.query(
      'SELECT * FROM exam_schedule_subjects WHERE schedule_id = $1 ORDER BY serial_no ASC',
      [schedule.id]
    );

    // 3. Query students using SELECT * to safely support all schema variations
    const studentsRes = await db.query(
      `SELECT * FROM students 
       WHERE class_name = $1 AND school_id = $2
       ORDER BY name ASC`,
      [schedule.class_name, req.user.school_id]
    );

    // 4. Map students with safe defaults for father_name, section, roll_no
    const students = studentsRes.rows.map(s => ({
      id: s.id,
      adm_no: s.adm_no,
      name: s.name,
      father_name: s.father_name || s.father || s.parent_name || '',
      class_name: s.class_name,
      section: s.section || '',
      gender: s.gender || '',
      photo_url: s.photo_url || s.photo || '',
    }));

    // 5. Get school name
    let schoolName = 'NEW SAINIK PUBLIC SCHOOL';
    try {
      const schoolRes = await db.query('SELECT name FROM schools WHERE id = $1', [req.user.school_id]);
      if (schoolRes.rows.length > 0 && schoolRes.rows[0].name) {
        schoolName = schoolRes.rows[0].name;
      }
    } catch (_) {
      // Fallback
    }

    res.status(200).json({
      data: {
        school_name: schoolName,
        schedule: { ...schedule, subjects: subjectsRes.rows },
        students: students,
        total_students: students.length
      }
    });
  } catch (error) {
    logger.error('Error generating admit cards:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ======================= DELETE SCHEDULE =======================

exports.deleteSchedule = async (req, res) => {
  await ensureTables();
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
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
