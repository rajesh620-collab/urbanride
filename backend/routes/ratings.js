/**
 * Rating routes
 *
 * POST   /api/ratings           → submit a rating
 * GET    /api/ratings/user/:id  → get user's average rating
 * GET    /api/ratings/ride/:id  → get all ratings for a ride
 * GET    /api/ratings/pending   → check if user has pending ratings
 */

const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const { ok, created, fail } = require('../utils/response');

// POST /api/ratings — submit a rating after ride completion
router.post('/', auth, async (req, res) => {
  try {
    const { rideId, toUserId, rating, comment } = req.body;

    if (!rideId || !toUserId || !rating) {
      return fail(res, 400, 'rideId, toUserId, and rating are required');
    }

    if (rating < 1 || rating > 5) {
      return fail(res, 400, 'Rating must be between 1 and 5');
    }

    // Verify ride is completed
    const ride = await Ride.findById(rideId);
    if (!ride) return fail(res, 404, 'Ride not found');
    if (ride.status !== 'completed') {
      return fail(res, 400, 'Can only rate completed rides');
    }

    // Verify user was part of this ride
    const isDriver = String(ride.driverId) === String(req.user.id);
    const booking = await Booking.findOne({
      rideId, passengerId: req.user.id, status: 'confirmed'
    });
    const isPassenger = !!booking;

    if (!isDriver && !isPassenger) {
      return fail(res, 403, 'You were not part of this ride');
    }

    // Check if already rated
    const existing = await Rating.findOne({
      rideId, fromUserId: req.user.id, toUserId
    });
    if (existing) return fail(res, 400, 'You have already rated this user for this ride');

    const newRating = await Rating.create({
      rideId,
      fromUserId: req.user.id,
      toUserId,
      rating,
      comment: comment || '',
      role: isDriver ? 'driver' : 'passenger'
    });

    return created(res, {
      message: 'Rating submitted',
      data: { rating: newRating }
    });
  } catch (err) {
    if (err.code === 11000) return fail(res, 400, 'Already rated');
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// GET /api/ratings/user/:userId — get average rating for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const ratings = await Rating.find({ toUserId: req.params.userId });
    if (ratings.length === 0) {
      return ok(res, {
        message: 'No ratings yet',
        data: { averageRating: 0, totalRatings: 0, ratings: [] }
      });
    }

    const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

    return ok(res, {
      message: `${ratings.length} rating(s)`,
      data: {
        averageRating: +avg.toFixed(1),
        totalRatings: ratings.length,
        ratings
      }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// GET /api/ratings/ride/:rideId — get all ratings for a ride
router.get('/ride/:rideId', async (req, res) => {
  try {
    const ratings = await Rating.find({ rideId: req.params.rideId });
    return ok(res, {
      message: `${ratings.length} rating(s)`,
      data: { ratings }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// GET /api/ratings/pending — get rides the user needs to rate
router.get('/pending', auth, async (req, res) => {
  try {
    // Find completed rides the user participated in
    const driverRides = await Ride.find({
      driverId: req.user.id, status: 'completed'
    });

    const passengerBookings = await Booking.find({
      passengerId: req.user.id, status: 'confirmed'
    }).populate('rideId');

    const passengerRides = passengerBookings
      .filter(b => b.rideId?.status === 'completed')
      .map(b => b.rideId);

    const allRides = [...driverRides, ...passengerRides];

    // Check which ones are unrated
    const pendingRatings = [];
    for (const ride of allRides) {
      const existingRatings = await Rating.find({
        rideId: ride._id, fromUserId: req.user.id
      });

      if (existingRatings.length === 0) {
        pendingRatings.push(ride);
      }
    }

    return ok(res, {
      message: `${pendingRatings.length} ride(s) pending rating`,
      data: { pendingRides: pendingRatings }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

module.exports = router;
