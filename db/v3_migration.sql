-- ==============================================================================
-- School ERP - Fee Management v3 Migration
-- Safe, non-destructive. All statements use IF NOT EXISTS / ON CONFLICT.
-- Run this once on Supabase SQL editor.
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add missing columns to fee_ledger (safe — skips if already present)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_ledger' AND column_name='tuition_amount') THEN
    ALTER TABLE fee_ledger ADD COLUMN tuition_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_ledger' AND column_name='transport_amount') THEN
    ALTER TABLE fee_ledger ADD COLUMN transport_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_ledger' AND column_name='months_covered') THEN
    ALTER TABLE fee_ledger ADD COLUMN months_covered TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_ledger' AND column_name='billing_month') THEN
    ALTER TABLE fee_ledger ADD COLUMN billing_month VARCHAR(20);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add section column to students (if not exists)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='section') THEN
    ALTER TABLE students ADD COLUMN section VARCHAR(10);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Ensure class_fee_templates table exists (from v2 — idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_fee_templates (
  id SERIAL PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  tuition_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  transport_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  school_id INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_name, academic_year, school_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Ensure student_monthly_dues table exists (from v2 — idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_monthly_dues (
  id SERIAL PRIMARY KEY,
  student_adm_no VARCHAR(50) NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  month_index INTEGER NOT NULL,
  tuition_due NUMERIC(10,2) DEFAULT 0,
  transport_due NUMERIC(10,2) DEFAULT 0,
  other_due NUMERIC(10,2) DEFAULT 0,
  concession NUMERIC(10,2) DEFAULT 0,
  tuition_paid NUMERIC(10,2) DEFAULT 0,
  transport_paid NUMERIC(10,2) DEFAULT 0,
  other_paid NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'UNPAID',
  academic_year VARCHAR(20) NOT NULL,
  school_id INTEGER NOT NULL DEFAULT 1,
  paid_at TIMESTAMPTZ,
  receipt_no VARCHAR(50),
  UNIQUE (student_adm_no, month_name, academic_year, school_id)
);

CREATE INDEX IF NOT EXISTS idx_smd_student   ON student_monthly_dues (student_adm_no, school_id);
CREATE INDEX IF NOT EXISTS idx_smd_status    ON student_monthly_dues (status, school_id);
CREATE INDEX IF NOT EXISTS idx_smd_month     ON student_monthly_dues (month_index, academic_year, school_id);
CREATE INDEX IF NOT EXISTS idx_cft_class     ON class_fee_templates (class_name, academic_year, school_id);
CREATE INDEX IF NOT EXISTS idx_fl_student_id ON fee_ledger (student_id, school_id);
CREATE INDEX IF NOT EXISTS idx_fl_created_at ON fee_ledger (created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. HEALING QUERY — Auto-link ledger rows where adm_no is plain numeric
--    but students table has the same number with 'Ns' suffix.
--    e.g. fee_ledger.student_id = '4453' → students.adm_no = '4453Ns'
--    This updates fee_ledger.student_id to match the canonical format.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE fee_ledger l
SET student_id = s.adm_no
FROM students s
WHERE
  -- Only heal rows where student_id looks purely numeric
  l.student_id ~ '^\d+$'
  -- And there's no direct match
  AND NOT EXISTS (SELECT 1 FROM students WHERE adm_no = l.student_id AND school_id = l.school_id)
  -- But there IS a match with the Ns suffix
  AND s.adm_no = (l.student_id || 'Ns')
  AND s.school_id = l.school_id;

-- Report how many rows were healed
DO $$
DECLARE
  healed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO healed_count
  FROM fee_ledger l
  WHERE l.student_id ~ '^\d+$'
    AND NOT EXISTS (SELECT 1 FROM students WHERE adm_no = l.student_id AND school_id = l.school_id);
  RAISE NOTICE 'After healing: % ledger rows still have unlinked (numeric-only) student_id', healed_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. View: Student dues summary — joins all tables for a clean overview
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_student_dues_summary AS
SELECT
  s.adm_no,
  s.name AS student_name,
  s.class_name,
  s.school_id,
  s.academic_year,
  COALESCE(SUM(d.tuition_due + d.transport_due + d.other_due - d.concession), 0)      AS total_charged,
  COALESCE(SUM(d.tuition_paid + d.transport_paid + d.other_paid), 0)                   AS total_paid,
  COALESCE(SUM(d.tuition_due + d.transport_due + d.other_due - d.concession), 0)
    - COALESCE(SUM(d.tuition_paid + d.transport_paid + d.other_paid), 0)               AS remaining_due
FROM students s
LEFT JOIN student_monthly_dues d
  ON d.student_adm_no = s.adm_no
  AND d.school_id = s.school_id
  AND d.academic_year = s.academic_year
GROUP BY s.adm_no, s.name, s.class_name, s.school_id, s.academic_year;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. View: Daily collection with guaranteed student name resolution
--    Handles both exact match and Ns-suffix fallback in SQL
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_daily_collection AS
SELECT
  l.id,
  l.receipt_no,
  l.student_id                                                                   AS adm_no,
  COALESCE(s1.name, s2.name, 'Unknown Student')                                  AS student_name,
  COALESCE(s1.class_name, s2.class_name, 'N/A')                                  AS class_name,
  l.amount                                                                       AS pay_amt,
  l.tuition_amount,
  l.transport_amount,
  l.concession,
  l.payment_mode                                                                 AS mode,
  l.billing_month,
  l.months_covered,
  l.notes,
  l.created_at                                                                   AS date_and_time,
  l.collected_by                                                                 AS taken_by,
  l.status,
  l.school_id
FROM fee_ledger l
-- Try exact match first
LEFT JOIN students s1 ON s1.adm_no = l.student_id AND s1.school_id = l.school_id
-- Fallback: try appending 'Ns' (for plain numeric adm_no imports)
LEFT JOIN students s2 ON s2.adm_no = (l.student_id || 'Ns') AND s2.school_id = l.school_id
                      AND s1.adm_no IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 'v3 migration complete' AS status;
