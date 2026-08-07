const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../utils/logger');

// Use Supabase connection pooler (IPv4, port 6543) to avoid IPv6 issues on Render
const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost/db');
// Replace direct host with pooler host
const poolerHost = dbUrl.hostname.replace('db.', 'aws-0-ap-northeast-1.pooler.');

const pool = new Pool({
  host: poolerHost,
  port: 6543,
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  ssl: { rejectUnauthorized: false },
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
