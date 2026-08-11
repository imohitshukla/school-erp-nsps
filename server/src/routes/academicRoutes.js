const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/exams', academicController.getExam);
router.post('/exams', academicController.createExam);
router.get('/marks/:examId', academicController.getMarks);
router.post('/marks', academicController.saveMarks);

module.exports = router;
