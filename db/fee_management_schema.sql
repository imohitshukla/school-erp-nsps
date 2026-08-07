-- ==============================================================================
-- School Management System (ERP) - Fee Management Module
-- Target RDBMS: PostgreSQL
-- Description: Zero-drift fee ledger schema for partial payments & concessions.
-- ==============================================================================

-- 1. Create Enums for Status and Payment Methods
CREATE TYPE fee_status AS ENUM ('PENDING', 'PARTIAL', 'PAID');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER');

-- 2. Fee Structures
-- Defines standard fees for a specific class/session.
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL, -- FK to Classes (Assume exists)
    session_id UUID NOT NULL, -- FK to Sessions (Assume exists)
    fee_name VARCHAR(255) NOT NULL, -- e.g., 'Term 1 Tuition', 'Annual Transport'
    base_amount NUMERIC(10, 2) NOT NULL CHECK (base_amount >= 0),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Student Fee Dues
-- Links standard fee structures to individual students with specific concessions.
CREATE TABLE student_fee_dues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL, -- FK to Students (Assume exists)
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE RESTRICT,
    -- Base amount copied from fee_structures to prevent historical drift
    base_amount NUMERIC(10, 2) NOT NULL CHECK (base_amount >= 0),
    -- Individual discounts for this student
    concession_amount NUMERIC(10, 2) DEFAULT 0 CHECK (concession_amount >= 0 AND concession_amount <= base_amount),
    -- Calculated net due
    net_due_amount NUMERIC(10, 2) GENERATED ALWAYS AS (base_amount - concession_amount) STORED,
    status fee_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups on student dues
CREATE INDEX idx_student_fee_dues_student ON student_fee_dues(student_id);

-- 4. Fee Ledger (Receipts)
-- Immutable ledger recording all incoming payments.
CREATE TABLE fee_ledger (
    receipt_no VARCHAR(50) PRIMARY KEY, -- E.g., 'REC-2026-0001'
    student_fee_due_id UUID NOT NULL REFERENCES student_fee_dues(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL, -- FK to Students for faster querying
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
    payment_method payment_method NOT NULL,
    transaction_ref VARCHAR(255), -- External gateway ID if digital payment
    handled_by UUID NOT NULL, -- FK to Users (Admin/Teacher)
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for generating daily collection reports
CREATE INDEX idx_fee_ledger_date ON fee_ledger(payment_date);

-- ==============================================================================
-- Validation Queries & Views (Zero-Drift & Reporting)
-- ==============================================================================

-- 1. View: Check for Zero-Drift (Ensure overpayment doesn't happen)
CREATE OR REPLACE VIEW v_student_fee_balance AS
SELECT 
    d.id AS due_id,
    d.student_id,
    d.fee_structure_id,
    d.net_due_amount,
    COALESCE(SUM(l.amount_paid), 0) AS total_paid,
    d.net_due_amount - COALESCE(SUM(l.amount_paid), 0) AS remaining_balance
FROM 
    student_fee_dues d
LEFT JOIN 
    fee_ledger l ON d.id = l.student_fee_due_id
GROUP BY 
    d.id, d.student_id, d.fee_structure_id, d.net_due_amount;

-- 2. Mock Query: Daily Collection Report by Date Range
/*
SELECT 
    DATE(l.payment_date) as collection_date,
    SUM(l.amount_paid) as daily_total,
    COUNT(l.receipt_no) as total_receipts
FROM 
    fee_ledger l
WHERE 
    l.payment_date >= '2026-01-01' AND l.payment_date <= '2026-01-31'
GROUP BY 
    DATE(l.payment_date)
ORDER BY 
    collection_date DESC;
*/
