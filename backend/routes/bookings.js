/**
 * Booking routes
 *
 * POST   /api/bookings           → book a seat
 * GET    /api/bookings/my        → passenger's bookings
 * GET    /api/bookings/ride/:id  → ride's bookings (driver only)
 * PATCH  /api/bookings/:id/cancel→ cancel booking
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  bookSeat,
  getMyBookings,
  getRideBookings,
  cancelBooking
} = require('../controllers/bookingController');

router.post('/',              auth, bookSeat);
router.get('/my',             auth, getMyBookings);
router.get('/ride/:rideId',   auth, getRideBookings);
router.patch('/:id/cancel',   auth, cancelBooking);

module.exports = router;