const db = require('../db');
const bcrypt = require('bcrypt');

exports.registerSchool = async (req, res) => {
  const { schoolName, adminEmail, adminPassword, subdomain } = req.body;

  if (!schoolName || !adminEmail || !adminPassword || !subdomain) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create the school
    const schoolResult = await client.query(
      `INSERT INTO schools (name, subdomain, contact_email) 
       VALUES ($1, $2, $3) RETURNING id`,
      [schoolName, subdomain, adminEmail]
    );

    const schoolId = schoolResult.rows[0].id;

    // 2. Hash password and create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await client.query(
      `INSERT INTO users (username, password_hash, role, school_id)
       VALUES ($1, $2, 'SUPER_ADMIN', $3)`,
      [adminEmail, passwordHash, schoolId]
    );

    await client.query('COMMIT');

    res.status(201).json({ 
      message: 'School registered successfully!',
      schoolId: schoolId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Subdomain or email already exists.' });
    }
    res.status(500).json({ error: 'Internal server error during registration.' });
  } finally {
    client.release();
  }
};
