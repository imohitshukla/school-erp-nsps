const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    if (['csv', 'xlsx', 'xls'].includes(ext)) cb(null, true);
    else cb(new Error('Only CSV and Excel (.xlsx/.xls) files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Collect new fee
router.post('/collect', feeController.collectFee);

// Manual historical fee entry (admin backdating)
router.post('/manual-entry', feeController.manualFeeEntry);

// Generate monthly charges for all students (cron-ready)
router.post('/generate-monthly', feeController.generateMonthlyCharges);

// Get daily collection report
router.get('/daily-collection', feeController.getDailyCollection);
router.get('/dashboard-stats', feeController.getFeeDashboardStats);

// Import route
router.post('/import', upload.single('file'), feeController.importFees);

// Export routes
router.get('/export/ledger', feeController.exportFeeLedger);
router.get('/export/defaulters', feeController.exportDefaulters);
router.get('/template', feeController.downloadFeeTemplate);

// --- FEE REPORTING ENGINE ROUTES ---
router.get('/reports/daily', feeController.getDailyCollectionReport);
router.get('/reports/range', feeController.getCustomDateRangeReport);
router.get('/reports/monthly', feeController.getMonthWiseSummary);
router.get('/reports/category', feeController.getCategoryWiseBreakdown);
router.get('/reports/defaulters', feeController.getDefaulterForecasting);

// Receipt details
router.get('/receipt/:receiptNo', feeController.getReceipt);

module.exports = router;

