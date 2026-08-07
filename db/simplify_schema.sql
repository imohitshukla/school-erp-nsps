DROP TABLE IF EXISTS fee_ledger CASCADE;
DROP TABLE IF EXISTS student_fee_dues CASCADE;
DROP TABLE IF EXISTS fee_structures CASCADE;
DROP TYPE IF EXISTS fee_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

CREATE TABLE fee_ledger (
    id SERIAL PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255),
    collected_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Success',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
