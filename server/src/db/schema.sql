-- ==============================================================================
-- School Management System (ERP) - Complete Database Schema
-- ==============================================================================

-- Enable UUID extension (useful if gen_random_uuid() is not built-in, though it is in pg 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT')),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- Students (Student Information System)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adm_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id),
    session_id UUID NOT NULL REFERENCES sessions(id),
    parent_id UUID REFERENCES users(id),
    emergency_contact VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Structures
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    session_id UUID NOT NULL REFERENCES sessions(id),
    fee_name VARCHAR(255) NOT NULL, 
    base_amount NUMERIC(10, 2) NOT NULL CHECK (base_amount >= 0),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Fee Dues
CREATE TABLE IF NOT EXISTS student_fee_dues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE RESTRICT,
    base_amount NUMERIC(10, 2) NOT NULL CHECK (base_amount >= 0),
    concession_amount NUMERIC(10, 2) DEFAULT 0 CHECK (concession_amount >= 0 AND concession_amount <= base_amount),
    net_due_amount NUMERIC(10, 2) GENERATED ALWAYS AS (base_amount - concession_amount) STORED,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fee Ledger (Financials)
CREATE TABLE IF NOT EXISTS fee_ledger (
    receipt_no VARCHAR(50) PRIMARY KEY,
    student_fee_due_id UUID NOT NULL REFERENCES student_fee_dues(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id),
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
    payment_method VARCHAR(20) NOT NULL,
    transaction_ref VARCHAR(255),
    handled_by UUID REFERENCES users(id),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams & Marks (Academics)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL,
    session_id UUID NOT NULL REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    exam_id UUID NOT NULL REFERENCES exams(id),
    score NUMERIC(5, 2) NOT NULL,
    UNIQUE(student_id, exam_id)
);
