const db = require('../db');
const logger = require('../utils/logger');

exports.getStaff = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM staff WHERE school_id = $1 ORDER BY name ASC`,
      [req.user.school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createStaff = async (req, res) => {
  const { name, department, role, phone, email, status, joining_date, base_salary } = req.body;
  if (!name || !department || !role) {
    return res.status(400).json({ error: 'name, department, and role are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO staff (school_id, name, department, role, phone, email, status, joining_date, base_salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.school_id, name, department, role, phone || '', email || '', status || 'Active', joining_date || null, base_salary || 0.00]
    );
    res.status(201).json({ message: 'Staff member added successfully', data: result.rows[0] });
  } catch (error) {
    logger.error('Error creating staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, department, role, phone, email, status, base_salary } = req.body;
  try {
    const result = await db.query(
      `UPDATE staff SET name=$1, department=$2, role=$3, phone=$4, email=$5, status=$6, base_salary=$7
       WHERE id=$8 AND school_id=$9 RETURNING *`,
      [name, department, role, phone, email, status, base_salary || 0.00, id, req.user.school_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff member not found' });
    res.status(200).json({ message: 'Staff member updated', data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM staff WHERE id=$1 AND school_id=$2', [id, req.user.school_id]);
    res.status(200).json({ message: 'Staff member removed' });
  } catch (error) {
    logger.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ======================= ATTENDANCE =======================

exports.markAttendance = async (req, res) => {
  const { records, date } = req.body; // records: [{staff_id, status}]
  try {
    for (let record of records) {
      await db.query(
        `INSERT INTO staff_attendance (school_id, staff_id, date, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (staff_id, date) DO UPDATE SET status = EXCLUDED.status, created_at = NOW()`,
        [req.user.school_id, record.staff_id, date, record.status]
      );
    }
    res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    logger.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAttendance = async (req, res) => {
  const { date } = req.query;
  try {
    const result = await db.query(
      `SELECT * FROM staff_attendance WHERE school_id = $1 AND date = $2`,
      [req.user.school_id, date]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ======================= PAYROLL =======================

exports.generateSalary = async (req, res) => {
  const { staff_id, month, year, deductions } = req.body;
  try {
    // get staff details
    const staffRes = await db.query(`SELECT * FROM staff WHERE id=$1 AND school_id=$2`, [staff_id, req.user.school_id]);
    if (staffRes.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    
    const staff = staffRes.rows[0];
    const base_salary = parseFloat(staff.base_salary || 0);
    const ded = parseFloat(deductions || 0);
    const net_salary = base_salary - ded;

    const result = await db.query(
      `INSERT INTO staff_salary_records (school_id, staff_id, month, year, base_salary, deductions, net_salary, payment_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'Paid') RETURNING *`,
      [req.user.school_id, staff_id, month, year, base_salary, ded, net_salary]
    );

    res.status(201).json({ message: 'Salary processed successfully', data: result.rows[0] });
  } catch (error) {
    logger.error('Error generating salary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSalaries = async (req, res) => {
  const { month, year } = req.query;
  try {
    let query = `
      SELECT sr.*, s.name, s.role, s.department 
      FROM staff_salary_records sr
      JOIN staff s ON s.id = sr.staff_id
      WHERE sr.school_id = $1
    `;
    const params = [req.user.school_id];
    if (month) { query += ` AND sr.month = $2`; params.push(month); }
    if (year) { query += ` AND sr.year = $${params.length + 1}`; params.push(year); }
    
    query += ` ORDER BY sr.created_at DESC`;
    
    const result = await db.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching salaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

