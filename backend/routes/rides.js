const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const { notifyRideRoom } = require('../services/websocketService');
const { checkPendingRequests } = require('../services/reNotificationEngine');

// POST /api/rides — post a new ride (driver)
router.post('/', auth, async (req, res) => {
  try {
    const {
      sourceLandmark, destinationLandmark,
      departureTime, totalSeats, femaleOnly, farePerSeat
    } = req.body;

    // Female-only rides can only be posted by female users
    if (femaleOnly && req.user.gender !== 'female') {
      return res.status(403).json({
        message: 'Only female users can post female-only rides'
      });
    }

    const ride = await Ride.create({
      driverId: req.user.id,
      driverName: req.user.name,
      sourceLandmark,
      destinationLandmark,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      femaleOnly: femaleOnly || false,
      farePerSeat,
      status: 'open'
    });

    // Trigger re-notification engine — notify anyone waiting for this route
    checkPendingRequests(ride);

    res.status(201).json({ ride });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rides/search — search available rides
router.get('/search', async (req, res) => {
  try {
    const { source, destination, time, femaleOnly } = req.query;

    // Build query
    const query = {
      status: 'open',
      availableSeats: { $gte: 1 }
    };

    if (source)      query.sourceLandmark = source;
    if (destination) query.destinationLandmark = destination;

    // Time window: ±60 minutes from requested time
    if (time) {
      const requestedTime = new Date(time);
      query.departureTime = {
        $gte: new Date(requestedTime.getTime() - 60 * 60 * 1000),
        $lte: new Date(requestedTime.getTime() + 60 * 60 * 1000)
      };
    }

    // Female-only filter
    if (femaleOnly === 'true') query.femaleOnly = true;

    const rides = await Ride.find(query).sort({ departureTime: 1 });
    res.json({ rides });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rides/my — get rides posted by logged-in driver
router.get('/my', auth, async (req, res) => {
  try {
    const rides = await Ride.find({ driverId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ rides });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rides/:id — get single ride details
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/rides/:id/status — driver updates ride status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (String(ride.driverId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    ride.status = status;
    await ride.save();

    // Notify all passengers in this ride room via WebSocket
    notifyRideRoom(ride._id, 'ride_status_updated', {
      rideId: ride._id,
      newStatus: status,
      message: `Ride is now ${status}`
    });

    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;