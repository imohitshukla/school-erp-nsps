const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/exams', academicController.getExam);
router.post('/exams', academicController.createExam);
router.get('/marks/:examId', academicController.getMarks);
router.post('/marks', academicController.saveMarks);

module.exports = router;
