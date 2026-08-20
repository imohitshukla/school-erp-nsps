const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', staffController.getStaff);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

// Attendance
router.get('/attendance', staffController.getAttendance);
router.post('/attendance', staffController.markAttendance);

// Salaries
router.get('/salaries', staffController.getSalaries);
router.post('/salaries', staffController.generateSalary);

module.exports = router;
