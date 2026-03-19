/**
 * Ride controller — handles all ride-related endpoints.
 */

const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const PendingRequest = require('../models/PendingRequest');
const { notifyRideRoom, notifyUser } = require('../services/websocketService');
const { checkPendingForNewRide } = require('../services/reNotificationEngine');
const { smartSearch, getNearbySharedRides } = require('../services/rideMatchingService');
const { ok, created, fail } = require('../utils/response');

/**
 * POST /api/rides
 * Driver posts a new ride. All rides are instant (no scheduled time required).
 */
async function postRide(req, res) {
  try {
    const {
      sourceLandmark, destinationLandmark,
      totalSeats, femaleOnly, farePerSeat
    } = req.body;

    if (!sourceLandmark || !destinationLandmark) {
      return fail(res, 400, 'Source and destination landmarks are required');
    }

    if (femaleOnly && req.user.gender !== 'female') {
      return fail(res, 403, 'Only female users can post female-only rides');
    }

    const ride = await Ride.create({
      driverId: req.user.id,
      driverName: req.user.name,
      sourceLandmark,
      destinationLandmark,
      departureTime: new Date(), // instant ride — departure is now
      totalSeats: totalSeats || 1,
      availableSeats: totalSeats || 1,
      femaleOnly: femaleOnly || false,
      farePerSeat: farePerSeat || 0,
      status: 'open'
    });

    // Smart re-notification — notify waiting users instantly
    checkPendingForNewRide(ride);

    return created(res, {
      type: 'shared',
      message: 'Ride posted successfully',
      data: { ride }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * POST /api/rides/search
 * Smart ride search: shared → walking → solo fallback.
 */
async function searchRides(req, res) {
  try {
    const { destinationLandmark, sourceLandmark, userLat, userLng, femaleOnly } = req.body;

    if (!destinationLandmark) {
      return fail(res, 400, 'destinationLandmark is required');
    }

    const result = await smartSearch({
      destinationLandmark,
      sourceLandmark,
      userLat: userLat ? parseFloat(userLat) : undefined,
      userLng: userLng ? parseFloat(userLng) : undefined,
      femaleOnly: femaleOnly === true || femaleOnly === 'true'
    });

    // If no shared rides and user is authenticated, auto-create a pending request
    if (result.type === 'solo' && req.user && sourceLandmark) {
      const existing = await PendingRequest.findOne({
        userId: req.user.id,
        sourceLandmark,
        destinationLandmark,
        status: 'active'
      });

      if (!existing) {
        await PendingRequest.create({
          userId: req.user.id,
          sourceLandmark,
          destinationLandmark,
          preferredTime: new Date(),
          femaleOnly: femaleOnly || false,
          timeWindowMinutes: 10,
          expiresAt: new Date(Date.now() + 5 * 60_000)
        });
        result.pendingCreated = true;
        result.message += ' — we\'ll notify you if a shared ride becomes available within 5 minutes';
      }
    }

    return ok(res, {
      type: result.type,
      message: result.message,
      data: result
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * GET /api/rides/search (legacy — backward compatible)
 */
async function searchRidesLegacy(req, res) {
  try {
    const { source, destination, femaleOnly } = req.query;

    const query = {
      status: 'open',
      availableSeats: { $gte: 1 }
    };

    if (source) query.sourceLandmark = source;
    if (destination) query.destinationLandmark = destination;
    if (femaleOnly === 'true') query.femaleOnly = true;

    const rides = await Ride.find(query).sort({ createdAt: -1 });

    return ok(res, {
      type: rides.length > 0 ? 'shared' : 'solo',
      message: rides.length > 0
        ? `${rides.length} ride${rides.length > 1 ? 's' : ''} found`
        : 'No rides found',
      data: { rides }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * GET /api/rides/nearby-shared
 */
async function nearbySharedRides(req, res) {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return fail(res, 400, 'lat and lng are required');

    const results = await getNearbySharedRides(
      parseFloat(lat), parseFloat(lng),
      radius ? parseInt(radius) : 500
    );

    return ok(res, {
      type: 'shared',
      message: `${results.length} shared ride${results.length !== 1 ? 's' : ''} nearby`,
      data: { rides: results }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * GET /api/rides/my
 */
async function getMyRides(req, res) {
  try {
    const rides = await Ride.find({ driverId: req.user.id }).sort({ createdAt: -1 });
    return ok(res, {
      message: `${rides.length} ride${rides.length !== 1 ? 's' : ''} found`,
      data: { rides }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * GET /api/rides/:id
 */
async function getRideById(req, res) {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return fail(res, 404, 'Ride not found');
    return ok(res, { data: { ride } });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

/**
 * PATCH /api/rides/:id/status
 * Driver updates ride status. FIXED: cancellation now works properly.
 */
async function updateRideStatus(req, res) {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return fail(res, 404, 'Ride not found');
    if (String(ride.driverId) !== String(req.user.id)) {
      return fail(res, 403, 'Not your ride');
    }

    // Validate status transitions — FIXED: cancelled allowed from any active state
    const validTransitions = {
      open:        ['in_progress', 'cancelled'],
      full:        ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
    };

    const allowed = validTransitions[ride.status] || [];
    if (!allowed.includes(status)) {
      return fail(res, 400, `Cannot change from '${ride.status}' to '${status}'`);
    }

    ride.status = status;
    await ride.save();

    // If cancelled, cancel all confirmed bookings and notify passengers
    if (status === 'cancelled') {
      const bookings = await Booking.find({ rideId: ride._id, status: 'confirmed' });
      for (const b of bookings) {
        b.status = 'cancelled';
        await b.save();
        notifyUser(String(b.passengerId), 'ride_cancelled', {
          message: `The ride from ${ride.sourceLandmark} to ${ride.destinationLandmark} has been cancelled by the driver`,
          rideId: ride._id
        });
      }
    }

    notifyRideRoom(ride._id, 'ride_status_updated', {
      rideId: ride._id,
      newStatus: status,
      message: `Ride is now ${status.replace('_', ' ')}`
    });

    return ok(res, {
      message: `Ride marked as ${status.replace('_', ' ')}`,
      data: { ride }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
}

module.exports = {
  postRide,
  searchRides,
  searchRidesLegacy,
  nearbySharedRides,
  getMyRides,
  getRideById,
  updateRideStatus
};
