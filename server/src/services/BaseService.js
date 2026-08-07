const db = require('../db');
const logger = require('../utils/logger');

class BaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findAll() {
    const query = `SELECT * FROM ${this.tableName}`;
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      logger.error(`Error in ${this.tableName} findAll: `, error);
      throw error;
    }
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      logger.error(`Error in ${this.tableName} findById: `, error);
      throw error;
    }
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Construct parameterized query dynamically
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      logger.error(`Error in ${this.tableName} create: `, error);
      throw error;
    }
  }
}

module.exports = BaseService;
