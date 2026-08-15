-- Run this in your Supabase SQL Editor to clear all imported fee data.
-- This will wipe out all fee payments and monthly dues so you can re-import from scratch.

-- 1. Delete all fee payments (receipts)
DELETE FROM fee_ledger;

-- 2. Delete all monthly fee dues
DELETE FROM student_monthly_dues;

-- 3. Reset all student fee structures to 0
UPDATE students 
SET payable_fee = 0, 
    transport_fee = 0, 
    concession = 0;

-- Done! You can now run the fee import again.
