/**
 * Ride routes
 *
 * POST   /api/rides              → post a new ride (driver)
 * POST   /api/rides/search       → smart search (shared → walk → solo)
 * GET    /api/rides/search       → legacy search (backward compatible)
 * GET    /api/rides/nearby-shared→ find shared rides near a location
 * GET    /api/rides/my           → get driver's own rides
 * GET    /api/rides/:id          → get single ride
 * PATCH  /api/rides/:id/status   → update ride status
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const {
  postRide,
  searchRides,
  searchRidesLegacy,
  nearbySharedRides,
  getMyRides,
  getRideById,
  updateRideStatus
} = require('../controllers/rideController');

router.post('/',              auth,         postRide);
router.post('/search',        optionalAuth, searchRides);       // NEW — smart search
router.get('/search',                       searchRidesLegacy); // legacy GET
router.get('/nearby-shared',                nearbySharedRides); // NEW
router.get('/my',             auth,         getMyRides);
router.get('/:id',                          getRideById);
router.patch('/:id/status',   auth,         updateRideStatus);

module.exports = router;