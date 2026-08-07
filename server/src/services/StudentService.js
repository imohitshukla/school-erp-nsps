const BaseService = require('./BaseService');
const db = require('../db');
const logger = require('../utils/logger');

class StudentService extends BaseService {
  constructor() {
    super('students');
  }

  // Example of overriding or adding specific methods
  async findWithDetails() {
    const query = `
      SELECT s.*, c.name as class_name, sess.name as session_name 
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sessions sess ON s.session_id = sess.id
    `;
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      logger.error('Error in StudentService findWithDetails: ', error);
      throw error;
    }
  }
}

module.exports = new StudentService();
