-- ==============================================================================
-- Admit Card Generator — Database Schema
-- Safe, non-destructive. All statements use IF NOT EXISTS.
-- Run this once on Supabase SQL editor.
-- ==============================================================================

-- 1. Exam schedule header (one per exam per class)
CREATE TABLE IF NOT EXISTS exam_schedules (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  exam_type VARCHAR(50) NOT NULL,          -- 'HALF YEARLY', 'ANNUAL', 'PT1', 'PT2'
  academic_year VARCHAR(20) NOT NULL,
  note_english TEXT DEFAULT '',             -- Footer note in English
  note_hindi TEXT DEFAULT '',               -- Footer note in Hindi
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, class_name, exam_type, academic_year)
);

-- 2. Exam schedule subjects (one row per subject per schedule)
CREATE TABLE IF NOT EXISTS exam_schedule_subjects (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
  serial_no INTEGER NOT NULL,
  subject VARCHAR(100) NOT NULL,
  exam_date DATE NOT NULL,
  start_time VARCHAR(20) NOT NULL,         -- '08:30 AM'
  end_time VARCHAR(20) NOT NULL,           -- '12:30 PM'
  room_no VARCHAR(20) DEFAULT '',
  UNIQUE(schedule_id, serial_no)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_es_school   ON exam_schedules (school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_es_class    ON exam_schedules (class_name, school_id);
CREATE INDEX IF NOT EXISTS idx_ess_sched   ON exam_schedule_subjects (schedule_id);

SELECT 'Admit card schema migration complete' AS status;
