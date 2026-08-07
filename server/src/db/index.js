const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../utils/logger');

// Parse connection string to force IPv4 - Render free tier doesn't support IPv6
const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost/db');

const pool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 5432,
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  ssl: { rejectUnauthorized: false },
  family: 4,  // Force IPv4
});

pool.on('connect', () => {
  logger.info('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
