/**
 * Booking routes
 *
 * POST   /api/bookings                → request to join/book
 * GET    /api/bookings/my             → passenger's bookings
 * GET    /api/bookings/ride/:id       → ride's bookings (driver only)
 * PATCH  /api/bookings/:id/accept     → driver accepts request
 * PATCH  /api/bookings/:id/confirm    → passenger confirms split fare
 * PATCH  /api/bookings/:id/reject     → driver rejects request
 * PATCH  /api/bookings/:id/cancel     → cancel booking
 * POST   /api/bookings/:id/verify-otp → driver verifies passenger OTP at pickup
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  bookSeat,
  getMyBookings,
  getRideBookings,
  acceptBooking,
  confirmPassengerBooking,
  rejectBooking,
  cancelBooking,
  verifyOtp
} = require('../controllers/bookingController');

router.post('/',                  auth, bookSeat);
router.get('/my',                 auth, getMyBookings);
router.get('/ride/:rideId',       auth, getRideBookings);
router.patch('/:id/accept',       auth, acceptBooking);
router.patch('/:id/confirm',      auth, confirmPassengerBooking);
router.patch('/:id/reject',       auth, rejectBooking);
router.patch('/:id/cancel',       auth, cancelBooking);
router.post('/:id/verify-otp',    auth, verifyOtp);

module.exports = router;