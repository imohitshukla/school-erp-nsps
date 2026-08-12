const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', communicationController.getCommunications);
router.post('/', communicationController.createCommunication);

module.exports = router;
