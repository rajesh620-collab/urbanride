const express = require('express');
const router = express.Router();
const controller = require('../controllers/ridePoolController');
const auth = require('../middleware/auth');

router.get('/my', auth, controller.getMyPools);
router.post('/create', auth, controller.createPool);
router.post('/:poolId/join', auth, controller.joinPool);
router.get('/search', auth, controller.searchPools);
router.get('/join/code/:code', auth, controller.getPoolByCode);
router.get('/:poolId', auth, controller.getPoolStatus);
router.patch('/:poolId/accept', auth, controller.acceptPoolRide);

module.exports = router;
