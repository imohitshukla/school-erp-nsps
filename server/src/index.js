require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

const feeRoutes = require('./routes/feeRoutes');
const feeSetupRoutes = require('./routes/feeSetupRoutes');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const tenantRoutes = require('./routes/tenantRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const academicRoutes = require('./routes/academicRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount Routes
app.use('/api/tenant', tenantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', authMiddleware, studentRoutes);
app.use('/api/fees', authMiddleware, feeRoutes);
app.use('/api/fee-setup', authMiddleware, feeSetupRoutes);
app.use('/api/communications', authMiddleware, communicationRoutes);
app.use('/api/academics', authMiddleware, academicRoutes);
app.use('/api/staff', authMiddleware, staffRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
