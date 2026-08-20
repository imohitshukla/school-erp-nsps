const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Expenses
router.get('/expenses', adminController.getExpenses);
router.post('/expenses', adminController.addExpense);

// Visitors
router.get('/visitors', adminController.getVisitors);
router.post('/visitors', adminController.addVisitor);
router.put('/visitors/:id/exit', adminController.markVisitorExit);

module.exports = router;
