require('dotenv').config();
const { Pool } = require('pg');

const dbUrl = new URL(process.env.DATABASE_URL);

const pool = new Pool({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: dbUrl.pathname.slice(1),
  user: `postgres.ifiqxahlwoqvjxsrafph`,
  password: decodeURIComponent(dbUrl.password),
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running Phase 1 Migration...');

    // 1. Add base_salary to staff
    console.log('Altering staff table...');
    await client.query(`
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10, 2) DEFAULT 0.00;
    `);

    // 2. Create staff_attendance table
    console.log('Creating staff_attendance table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id),
        staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL, -- Present, Absent, Half-Day, Leave
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(staff_id, date)
      );
    `);

    // 3. Create staff_salary_records table
    console.log('Creating staff_salary_records table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_salary_records (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id),
        staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
        month VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        deductions DECIMAL(10,2) DEFAULT 0.00,
        net_salary DECIMAL(10,2) NOT NULL,
        payment_date DATE,
        status VARCHAR(20) DEFAULT 'Paid',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Create expenses table
    console.log('Creating expenses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 5. Create visitors table
    console.log('Creating visitors table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        purpose TEXT,
        whom_to_meet VARCHAR(255),
        entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        exit_time TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Apply RLS to new tables
    console.log('Enabling RLS on new tables...');
    await client.query(`ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE staff_salary_records ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;`);

    console.log('Phase 1 Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
