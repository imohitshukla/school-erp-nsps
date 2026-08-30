const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/students');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const admNo = req.params.admNo || 'student';
    const safeAdm = admNo.replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, safeAdm + '_' + Date.now() + ext);
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});


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
router.get('/search', studentController.searchStudents);
router.get('/adm/:admNo', studentController.getStudentByAdmNo);
router.put('/:admNo/fees', studentController.updateStudentFees);
router.post('/:admNo/photo', uploadPhoto.single('photo'), studentController.uploadStudentPhoto);

module.exports = router;
