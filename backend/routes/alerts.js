const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.post('/trigger', protect, alertController.triggerAlert);
router.get('/', protect, alertController.getAlerts);

module.exports = router;
