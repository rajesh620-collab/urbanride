const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const { notifyRideRoom, notifyUser } = require('../services/websocketService');

// POST /api/bookings — passenger books a seat
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      passengerId: req.user.id
    }).populate("rideId");

    res.json({ bookings });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.post('/', auth, async (req, res) => {
  try {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    // Check ride is still open
    if (ride.status !== 'open') {
      return res.status(400).json({ message: 'Ride is no longer available' });
    }

    // Check seats available
    if (ride.availableSeats < 1) {
      return res.status(400).json({ message: 'No seats available' });
    }

    // Cannot book your own ride
    if (String(ride.driverId) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot book your own ride' });
    }

    // Female-only check
    if (ride.femaleOnly && req.user.gender !== 'female') {
      return res.status(403).json({ message: 'This ride is for female passengers only' });
    }

    // Check if passenger already booked this ride
    const existingBooking = await Booking.findOne({
      rideId,
      passengerId: req.user.id,
      status: 'confirmed'
    });
    if (existingBooking) {
      return res.status(400).json({ message: 'You have already booked this ride' });
    }

    // Create booking
    const booking = await Booking.create({
      rideId,
      passengerId: req.user.id,
      passengerName: req.user.name,
      seatsBooked: 1
    });

    // Decrease available seats
    ride.availableSeats -= 1;
    if (ride.availableSeats === 0) ride.status = 'full';
    await ride.save();

    // Notify everyone in the ride room via WebSocket
    notifyRideRoom(rideId, 'seat_booked', {
      rideId,
      availableSeats: ride.availableSeats,
      passengerName: req.user.name,
      message: `${req.user.name} joined the ride`
    });

    // Notify driver specifically
    notifyUser(String(ride.driverId), 'new_booking', {
      message: `${req.user.name} booked a seat on your ride`,
      rideId,
      bookingId: booking._id
    });

    res.status(201).json({ booking, ride });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/bookings/my — get all bookings for logged-in passenger
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      passengerId: req.user.id
    }).populate('rideId').sort({ bookedAt: -1 });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/bookings/ride/:rideId — get all bookings for a ride (driver only)
router.get('/ride/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (String(ride.driverId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    const bookings = await Booking.find({
      rideId: req.params.rideId,
      status: 'confirmed'
    });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/bookings/:id/cancel — passenger cancels booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (String(booking.passengerId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Give seat back
    await Ride.findByIdAndUpdate(booking.rideId, {
      $inc: { availableSeats: 1 },
      status: 'open'
    });

    // Notify ride room
    notifyRideRoom(booking.rideId, 'booking_cancelled', {
      rideId: booking.rideId,
      message: `${req.user.name} cancelled their booking`
    });

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;