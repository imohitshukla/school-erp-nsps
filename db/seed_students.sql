DROP TABLE IF EXISTS students CASCADE;

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    adm_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL
);

INSERT INTO students (adm_no, name, class_name) VALUES
('A001', 'Rahul Kumar', 'LKG A'),
('A002', 'Priya Sharma', 'LKG A'),
('A003', 'Amit Singh', 'UKG A'),
('A004', 'Sneha Patel', 'UKG A'),
('A005', 'Rohan Gupta', '1st A'),
('A006', 'Neha Verma', '1st A'),
('A007', 'Aryan Mishra', '2nd A'),
('A008', 'Kavya Reddy', '3rd A');
