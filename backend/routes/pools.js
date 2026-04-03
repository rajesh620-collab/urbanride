const express = require('express');
const router = express.Router();
const controller = require('../controllers/ridePoolController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, controller.createPool);
router.post('/:poolId/join', protect, controller.joinPool);
router.get('/search', protect, controller.searchPools);
router.get('/join/code/:code', protect, controller.getPoolByCode);
router.get('/:poolId', protect, controller.getPoolStatus);
router.patch('/:poolId/accept', protect, controller.acceptPoolRide);

module.exports = router;
