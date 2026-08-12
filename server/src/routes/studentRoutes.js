const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

const multer = require('multer');

// Accept CSV and Excel files
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',   // some OS report csv as text/plain
      'application/octet-stream', // fallback
    ];
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ['csv', 'xlsx', 'xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel (.xlsx/.xls) files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

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
