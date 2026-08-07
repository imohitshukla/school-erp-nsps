const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Public route for a new school to register
router.post('/register', tenantController.registerSchool);

module.exports = router;
