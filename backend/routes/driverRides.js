/**
 * Driver Ride Routes (On-Demand rides — Rapido/Ola/Uber style)
 *
 * POST   /api/driver-rides                    → create a ride request
 * GET    /api/driver-rides/my                 → driver's own rides
 * GET    /api/driver-rides/available          → available pending requests
 * GET    /api/driver-rides/earnings           → driver earnings summary
 * POST   /api/driver-rides/simulate-request   → simulate incoming request (demo)
 * GET    /api/driver-rides/:id                → get single ride
 * PATCH  /api/driver-rides/:id/accept         → driver accepts ride (generates OTP)
 * PATCH  /api/driver-rides/:id/arrived        → driver marks arrived at pickup
 * PATCH  /api/driver-rides/:id/verify-otp     → verify OTP to start ride
 * PATCH  /api/driver-rides/:id/complete       → complete the ride
 * PATCH  /api/driver-rides/:id/cancel         → cancel the ride
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRide,
  getMyRides,
  getAvailableRides,
  getEarnings,
  simulateRequest,
  getRideById,
  acceptRide,
  markArrived,
  verifyOTP,
  completeRide,
  cancelRide,
} = require('../controllers/driverRideController');

router.post('/',                     auth, createRide);
router.get('/my',                    auth, getMyRides);
router.get('/available',             auth, getAvailableRides);
router.get('/earnings',              auth, getEarnings);
router.post('/simulate-request',     auth, simulateRequest);
router.get('/:id',                   auth, getRideById);
router.patch('/:id/accept',          auth, acceptRide);
router.patch('/:id/arrived',         auth, markArrived);
router.patch('/:id/verify-otp',      auth, verifyOTP);
router.patch('/:id/complete',        auth, completeRide);
router.patch('/:id/cancel',          auth, cancelRide);

module.exports = router;
