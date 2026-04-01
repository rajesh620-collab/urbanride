/**
 * Booking controller — handles seat booking, listing, and cancellation.
 */

const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { notifyRideRoom, notifyUser } = require('../services/websocketService');
const { ok, created, fail } = require('../utils/response');

/**
 * POST /api/bookings
 * Passenger requests to join a ride.
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

    // Check duplicate booking (ignore cancelled/rejected)
    const existing = await Booking.findOne({
      rideId,
      passengerId: req.user.id,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existing) return fail(res, 400, 'You have a pending or confirmed booking for this ride');

    // Create booking (defaults to 'pending')
    const booking = await Booking.create({
      rideId,
      passengerId: req.user.id,
      passengerName: req.user.name,
      seatsBooked: seatsToBook,
      status: 'pending' // explicit
    });

    // Notify driver of a new request
    notifyUser(String(ride.driverId), 'new_booking_request', {
      message: `${req.user.name} wants to join your ride with ${seatsToBook} seat(s)`,
      rideId,
      bookingId: booking._id
    });

    return created(res, {
      message: 'Join request sent. Waiting for driver acceptance.',
      data: { booking }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * PATCH /api/bookings/:id/accept
 * Driver accepts the passenger's join request.
 * Transitions from 'pending' to 'accepted_by_driver'.
 */
async function acceptBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return fail(res, 404, 'Booking not found');

    const ride = await Ride.findById(booking.rideId);
    if (!ride) return fail(res, 404, 'Ride not found');

    if (String(ride.driverId) !== String(req.user.id)) {
      return fail(res, 403, 'Not your ride');
    }

    if (booking.status !== 'pending') {
      return fail(res, 400, `Booking is already ${booking.status}`);
    }

    // Move to accepted phase. Price will be shown to passenger for final confirm.
    booking.status = 'accepted_by_driver';
    await booking.save();

    // Notify passenger that driver is ready - now they must confirm price
    notifyUser(String(booking.passengerId), 'driver_accepted_match', {
      message: `Driver ${ride.driverName} is ready! Review the shared fare to confirm your ride.`,
      rideId: ride._id,
      bookingId: booking._id
    });

    return ok(res, { message: 'Match accepted by driver', data: { booking } });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * PATCH /api/bookings/:id/confirm
 * Passenger confirms the final split price and joins the ride.
 */
async function confirmPassengerBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return fail(res, 404, 'Booking not found');

    if (String(booking.passengerId) !== String(req.user.id)) {
      return fail(res, 403, 'Not your booking');
    }

    if (booking.status !== 'accepted_by_driver') {
      return fail(res, 400, 'Driver has not accepted your request yet');
    }

    const ride = await Ride.findById(booking.rideId);
    if (!ride || ride.availableSeats < booking.seatsBooked) {
      return fail(res, 400, 'Ride is no longer available');
    }

    // Calculate dynamic pricing
    // N = existing confirmed bookings + current one
    const confirmedCount = await Booking.countDocuments({ 
      rideId: ride._id, 
      status: 'confirmed' 
    });

    // Finalize
    booking.status = 'confirmed';
    await booking.save();

    // Update ride - decrement seats and update dynamic price for others
    ride.availableSeats -= booking.seatsBooked;
    if (ride.availableSeats <= 0) ride.status = 'full';
    
    // Dynamic Fare logic: Total / (Confirmed passengers + 1 driver?) 
    // Driver example: 100 / 3 passengers = ₹33 each.
    const newPassengerCount = confirmedCount + 1;
    ride.farePerSeat = Math.ceil(ride.baseTotalRideFare / newPassengerCount);
    
    await ride.save();

    // Broadcast updated price to everyone in the ride
    notifyRideRoom(String(ride._id), 'price_updated', {
      newFare: ride.farePerSeat,
      message: `New passenger joined! Fare dropped to ₹${ride.farePerSeat}`
    });

    return ok(res, { 
      message: 'Booking confirmed successfully', 
      data: { booking, ride } 
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * PATCH /api/bookings/:id/reject
 * Driver ignores or rejects the passenger's request.
 */
async function rejectBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return fail(res, 404, 'Booking not found');

    const ride = await Ride.findById(booking.rideId);
    if (String(ride.driverId) !== String(req.user.id)) {
      return fail(res, 403, 'Not your ride');
    }

    booking.status = 'rejected';
    await booking.save();

    notifyUser(String(booking.passengerId), 'booking_rejected', {
      message: `Sorry, your request to join the ride from ${ride.sourceLandmark} was declined by the driver.`,
      rideId: ride._id
    });

    return ok(res, { message: 'Request rejected' });
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

    // Driver sees all non-cancelled bookings
    const bookings = await Booking.find({
      rideId: req.params.rideId,
      status: { $ne: 'cancelled' }
    }).sort({ bookedAt: -1 });

    return ok(res, {
      message: `${bookings.length} request(s) found`,
      data: { bookings }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * PATCH /api/bookings/:id/cancel
 * Cancel a booking and release the seat (passenger-side).
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

    const oldStatus = booking.status;
    booking.status = 'cancelled';
    await booking.save();

    // Give seat(s) back only if it was already confirmed
    if (oldStatus === 'confirmed') {
      const ride = await Ride.findById(booking.rideId);
      if (ride) {
        ride.availableSeats += booking.seatsBooked;
        if (ride.status === 'full') ride.status = 'open';
        
        // Recalculate price upward?
        const confirmedCount = await Booking.countDocuments({ rideId: ride._id, status: 'confirmed' });
        if (confirmedCount > 0) {
            ride.farePerSeat = Math.ceil(ride.baseTotalRideFare / confirmedCount);
        } else {
            ride.farePerSeat = ride.baseTotalRideFare; // fallback
        }
        await ride.save();
      }
      
      notifyRideRoom(booking.rideId, 'booking_cancelled', {
        rideId: booking.rideId,
        message: `${req.user.name} cancelled their booking`,
        availableSeats: ride?.availableSeats,
        newFare: ride?.farePerSeat
      });
    }

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
  acceptBooking,
  confirmPassengerBooking,
  rejectBooking,
  cancelBooking
};
