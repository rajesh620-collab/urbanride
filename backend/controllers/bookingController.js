/**
 * Booking controller — handles seat booking, listing, and cancellation.
 */

const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { notifyRideRoom, notifyUser } = require('../services/websocketService');
const { ok, created, fail } = require('../utils/response');

/**
 * POST /api/bookings
 * Book a seat on a ride (shared or solo).
 */
async function bookSeat(req, res) {
  try {
    const { rideId, seats } = req.body;
    const seatsToBook = seats || 1;

    const ride = await Ride.findById(rideId);
    if (!ride) return fail(res, 404, 'Ride not found');

    if (ride.status !== 'open') {
      return fail(res, 400, 'Ride is no longer available for booking');
    }

    if (ride.availableSeats < seatsToBook) {
      return fail(res, 400, `Only ${ride.availableSeats} seat(s) available`);
    }

    if (String(ride.driverId) === String(req.user.id)) {
      return fail(res, 400, 'You cannot book your own ride');
    }

    if (ride.femaleOnly && req.user.gender !== 'female') {
      return fail(res, 403, 'This ride is for female passengers only');
    }

    // Check duplicate booking
    const existing = await Booking.findOne({
      rideId,
      passengerId: req.user.id,
      status: 'confirmed'
    });
    if (existing) return fail(res, 400, 'You have already booked this ride');

    // Create booking
    const booking = await Booking.create({
      rideId,
      passengerId: req.user.id,
      passengerName: req.user.name,
      seatsBooked: seatsToBook
    });

    // Update ride
    ride.availableSeats -= seatsToBook;
    if (ride.availableSeats <= 0) ride.status = 'full';
    await ride.save();

    // WebSocket notifications
    notifyRideRoom(rideId, 'seat_booked', {
      rideId,
      availableSeats: ride.availableSeats,
      passengerName: req.user.name,
      message: `${req.user.name} joined the ride`
    });

    notifyUser(String(ride.driverId), 'new_booking', {
      message: `${req.user.name} booked ${seatsToBook} seat(s) on your ride`,
      rideId,
      bookingId: booking._id
    });

    return created(res, {
      type: 'shared',
      message: 'Seat booked successfully',
      data: { booking, ride }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * GET /api/bookings/my
 * Get all bookings for the logged-in passenger.
 */
async function getMyBookings(req, res) {
  try {
    const bookings = await Booking.find({ passengerId: req.user.id })
      .populate('rideId')
      .sort({ bookedAt: -1 });

    return ok(res, {
      message: `${bookings.length} booking(s) found`,
      data: { bookings }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * GET /api/bookings/ride/:rideId
 * Get all bookings for a specific ride (driver only).
 */
async function getRideBookings(req, res) {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return fail(res, 404, 'Ride not found');

    if (String(ride.driverId) !== String(req.user.id)) {
      return fail(res, 403, 'Not your ride');
    }

    const bookings = await Booking.find({
      rideId: req.params.rideId,
      status: 'confirmed'
    });

    return ok(res, {
      message: `${bookings.length} confirmed booking(s)`,
      data: { bookings }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * PATCH /api/bookings/:id/cancel
 * Cancel a booking and release the seat.
 */
async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return fail(res, 404, 'Booking not found');

    if (String(booking.passengerId) !== String(req.user.id)) {
      return fail(res, 403, 'Not your booking');
    }

    if (booking.status === 'cancelled') {
      return fail(res, 400, 'Booking already cancelled');
    }

    booking.status = 'cancelled';
    await booking.save();

    // Give seat(s) back
    const ride = await Ride.findById(booking.rideId);
    if (ride) {
      ride.availableSeats += booking.seatsBooked;
      if (ride.status === 'full') ride.status = 'open';
      await ride.save();
    }

    notifyRideRoom(booking.rideId, 'booking_cancelled', {
      rideId: booking.rideId,
      message: `${req.user.name} cancelled their booking`,
      availableSeats: ride?.availableSeats
    });

    return ok(res, {
      message: 'Booking cancelled',
      data: { booking }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

module.exports = {
  bookSeat,
  getMyBookings,
  getRideBookings,
  cancelBooking
};
