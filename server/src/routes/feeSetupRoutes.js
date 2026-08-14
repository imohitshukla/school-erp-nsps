const express = require('express');
const router = express.Router();
const feeSetupController = require('../controllers/feeSetupController');

router.get('/', feeSetupController.getTemplates);
router.post('/', feeSetupController.upsertTemplate);
router.delete('/:id', feeSetupController.deleteTemplate);
router.post('/apply', feeSetupController.applyTemplate);
router.post('/apply-single', feeSetupController.applySingleStudent);

module.exports = router;
