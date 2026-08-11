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
  const { name, department, role, phone, email, status, joining_date } = req.body;
  if (!name || !department || !role) {
    return res.status(400).json({ error: 'name, department, and role are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO staff (school_id, name, department, role, phone, email, status, joining_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.school_id, name, department, role, phone || '', email || '', status || 'Active', joining_date || null]
    );
    res.status(201).json({ message: 'Staff member added successfully', data: result.rows[0] });
  } catch (error) {
    logger.error('Error creating staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, department, role, phone, email, status } = req.body;
  try {
    const result = await db.query(
      `UPDATE staff SET name=$1, department=$2, role=$3, phone=$4, email=$5, status=$6
       WHERE id=$7 AND school_id=$8 RETURNING *`,
      [name, department, role, phone, email, status, id, req.user.school_id]
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
