const db = require('../db');
const logger = require('../utils/logger');

exports.getCommunications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM communications 
       WHERE school_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.school_id]
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCommunication = async (req, res) => {
  const { type, subject, message, recipient_group } = req.body;

  if (!type || !message) {
    return res.status(400).json({ error: 'Type and message are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO communications (school_id, type, subject, message, recipient_group, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.school_id, type, subject || '', message, recipient_group || 'All', type === 'Notice' ? 'Active' : 'Sent']
    );

    res.status(201).json({ 
      message: 'Communication sent successfully', 
      data: result.rows[0] 
    });
  } catch (error) {
    logger.error('Error creating communication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
