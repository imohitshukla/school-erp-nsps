const express = require('express');
const router = express.Router();
const admitCardController = require('../controllers/admitCardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Exam schedule CRUD
router.post('/schedules', admitCardController.createSchedule);
router.get('/schedules', admitCardController.getSchedules);
router.get('/schedules/:id', admitCardController.getScheduleById);
router.delete('/schedules/:id', admitCardController.deleteSchedule);

// Generate admit card data for all students in a schedule's class
router.get('/generate/:scheduleId', admitCardController.generateAdmitCards);

module.exports = router;
