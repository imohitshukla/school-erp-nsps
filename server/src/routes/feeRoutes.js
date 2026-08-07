const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Collect new fee
router.post('/collect', feeController.collectFee);

// Get daily collection report
router.get('/daily-collection', feeController.getDailyCollection);
router.get('/dashboard-stats', feeController.getFeeDashboardStats);

// New import route
router.post('/import', upload.single('file'), feeController.importFees);

// --- FEE REPORTING ENGINE ROUTES ---
router.get('/reports/daily', feeController.getDailyCollectionReport);
router.get('/reports/range', feeController.getCustomDateRangeReport);
router.get('/reports/monthly', feeController.getMonthWiseSummary);
router.get('/reports/category', feeController.getCategoryWiseBreakdown);
router.get('/reports/defaulters', feeController.getDefaulterForecasting);

module.exports = router;
