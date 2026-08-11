const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', communicationController.getCommunications);
router.post('/', communicationController.createCommunication);

module.exports = router;
