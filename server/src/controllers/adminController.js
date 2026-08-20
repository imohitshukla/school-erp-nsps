const db = require('../db');
const logger = require('../utils/logger');

// ======================= EXPENSES =======================

exports.getExpenses = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM expenses WHERE school_id = $1 ORDER BY expense_date DESC`,
      [req.user.school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addExpense = async (req, res) => {
  const { title, category, amount, expense_date, description } = req.body;
  if (!title || !category || !amount || !expense_date) {
    return res.status(400).json({ error: 'title, category, amount, and expense_date are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO expenses (school_id, title, category, amount, expense_date, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.school_id, title, category, amount, expense_date, description || '']
    );
    res.status(201).json({ message: 'Expense added successfully', data: result.rows[0] });
  } catch (error) {
    logger.error('Error adding expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ======================= VISITORS =======================

exports.getVisitors = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM visitors WHERE school_id = $1 ORDER BY entry_time DESC`,
      [req.user.school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching visitors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addVisitor = async (req, res) => {
  const { name, phone, purpose, whom_to_meet } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO visitors (school_id, name, phone, purpose, whom_to_meet, entry_time)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [req.user.school_id, name, phone, purpose || '', whom_to_meet || '']
    );
    res.status(201).json({ message: 'Visitor logged successfully', data: result.rows[0] });
  } catch (error) {
    logger.error('Error adding visitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.markVisitorExit = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE visitors SET exit_time = NOW() WHERE id=$1 AND school_id=$2 RETURNING *`,
      [id, req.user.school_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    res.status(200).json({ message: 'Exit time marked', data: result.rows[0] });
  } catch (error) {
    logger.error('Error marking visitor exit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
