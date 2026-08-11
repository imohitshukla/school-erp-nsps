const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

const multer = require('multer');

// Configure multer for CSV upload (store temporarily in uploads/)
const upload = multer({ dest: 'uploads/' });

router.get('/stats', studentController.getStudentStats);
router.get('/classes', studentController.getClasses);
router.get('/', studentController.getStudents);
router.post('/', studentController.createStudent);
router.post('/import', upload.single('file'), studentController.importStudents);
router.get('/export', studentController.exportStudents);
router.get('/template', studentController.downloadStudentTemplate);
router.get('/class/:className', studentController.getStudentsByClass);
router.get('/adm/:admNo', studentController.getStudentByAdmNo);

module.exports = router;
