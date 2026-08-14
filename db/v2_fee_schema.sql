-- ==============================================================================
-- School ERP - Fee Management v2 Migration
-- Adds class_fee_templates and student_monthly_dues for month-wise fee tracking
-- ==============================================================================

-- 1. Class Fee Templates — Admin defines fees per class per academic year
CREATE TABLE IF NOT EXISTS class_fee_templates (
  id SERIAL PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  tuition_fee NUMERIC(10,2) NOT NULL DEFAULT 0,       -- Annual tuition
  transport_fee NUMERIC(10,2) NOT NULL DEFAULT 0,      -- Annual transport
  other_fee NUMERIC(10,2) NOT NULL DEFAULT 0,          -- Annual other/misc
  school_id INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_name, academic_year, school_id)
);

-- 2. Student Monthly Dues — One row per student per month (12 months per year)
CREATE TABLE IF NOT EXISTS student_monthly_dues (
  id SERIAL PRIMARY KEY,
  student_adm_no VARCHAR(50) NOT NULL,
  month_name VARCHAR(20) NOT NULL,            -- 'April', 'May', ... 'March'
  month_index INTEGER NOT NULL,               -- 1=April, 2=May, ... 12=March
  tuition_due NUMERIC(10,2) DEFAULT 0,
  transport_due NUMERIC(10,2) DEFAULT 0,
  other_due NUMERIC(10,2) DEFAULT 0,
  concession NUMERIC(10,2) DEFAULT 0,
  tuition_paid NUMERIC(10,2) DEFAULT 0,
  transport_paid NUMERIC(10,2) DEFAULT 0,
  other_paid NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'UNPAID',        -- UNPAID / PARTIAL / PAID
  academic_year VARCHAR(20) NOT NULL,
  school_id INTEGER NOT NULL DEFAULT 1,
  paid_at TIMESTAMPTZ,
  receipt_no VARCHAR(50),
  UNIQUE (student_adm_no, month_name, academic_year, school_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_smd_student ON student_monthly_dues (student_adm_no, school_id);
CREATE INDEX IF NOT EXISTS idx_smd_status ON student_monthly_dues (status, school_id);
CREATE INDEX IF NOT EXISTS idx_smd_month ON student_monthly_dues (month_index, academic_year, school_id);
CREATE INDEX IF NOT EXISTS idx_cft_class ON class_fee_templates (class_name, academic_year, school_id);

-- 3. Add month_paid array support to fee_ledger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_ledger' AND column_name = 'months_covered'
  ) THEN
    ALTER TABLE fee_ledger ADD COLUMN months_covered TEXT;  -- comma-separated: 'April,May,June'
  END IF;
END $$;
