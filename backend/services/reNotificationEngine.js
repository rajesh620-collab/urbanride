/**
 * Smart Re-Notification Engine
 *
 * Flow:
 * 1. When a new ride is posted → instantly check matching pending requests
 * 2. Cron job runs every 2 minutes to re-check all active pending requests
 * 3. Pending requests expire after a configurable TTL (default: 5 minutes for urgent, 24h for standard)
 * 4. Once matched, notify the user in real-time via WebSocket
 */

const cron = require('node-cron');
const PendingRequest = require('../models/PendingRequest');
const Ride = require('../models/Ride');
const Landmark = require('../models/Landmark');
const { notifyUser, isUserOnline } = require('./websocketService');
const { haversineDistance } = require('../utils/geo');

const NEARBY_THRESHOLD_M = 500; // consider rides from nearby landmarks too

/**
 * Check pending requests that match a newly posted ride.
 * Called immediately when a driver posts a new ride.
 */
async function checkPendingForNewRide(newRide) {
  try {
    // Find active pending requests headed to the same destination
    const pendingRequests = await PendingRequest.find({
      status: 'active',
      destinationLandmark: newRide.destinationLandmark,
      _id: { $nin: [] } // always run
    });

    const allLandmarks = await Landmark.find({});

    for (const req of pendingRequests) {
      // Skip if already notified about this ride
      if (req.notifiedRideIds?.includes(newRide._id)) continue;

      // Check source match (exact or nearby)
      const isExactSource = req.sourceLandmark === newRide.sourceLandmark;
      let isNearbySource = false;

      if (!isExactSource) {
        const reqLm = allLandmarks.find(l => l.name === req.sourceLandmark);
        const rideLm = allLandmarks.find(l => l.name === newRide.sourceLandmark);
        if (reqLm?.lat && rideLm?.lat) {
          const dist = haversineDistance(reqLm.lat, reqLm.lng, rideLm.lat, rideLm.lng);
          isNearbySource = dist <= NEARBY_THRESHOLD_M;
        }
      }

      if (!isExactSource && !isNearbySource) continue;

      // Check time window
      const timeWindow = req.timeWindowMinutes || 10;
      const timeMin = new Date(req.preferredTime.getTime() - timeWindow * 60_000);
      const timeMax = new Date(req.preferredTime.getTime() + timeWindow * 60_000);
      const rideTime = new Date(newRide.departureTime);

      if (rideTime < timeMin || rideTime > timeMax) continue;

      // Check female-only constraint
      if (req.femaleOnly && !newRide.femaleOnly) continue;

      // ── Match found! Notify user ──
      const notified = notifyUser(req.userId, 'ride_match_found', {
        message: isExactSource
          ? `A shared ride is now available from ${newRide.sourceLandmark}!`
          : `A shared ride is available nearby at ${newRide.sourceLandmark}`,
        rides: [newRide],
        isExactMatch: isExactSource
      });

      // Track which rides we've notified about
      await PendingRequest.findByIdAndUpdate(req._id, {
        $push: { notifiedRideIds: newRide._id },
        ...(notified ? {} : {}) // keep active even if user is offline
      });

      console.log(`[Re-Notify] Matched ride ${newRide._id} → user ${req.userId} (online: ${notified})`);
    }
  } catch (err) {
    console.error('[Re-Notify] Error checking new ride:', err.message);
  }
}

/**
 * Periodic sweep: check all active pending requests against all open rides.
 * Catches any rides that might have been missed.
 */
async function sweepAllPending() {
  try {
    const activeRequests = await PendingRequest.find({ status: 'active' });
    if (activeRequests.length === 0) return;

    for (const req of activeRequests) {
      // Check if expired (5 min for urgent mode)
      if (req.expiresAt && new Date() > req.expiresAt) {
        await PendingRequest.findByIdAndUpdate(req._id, { status: 'expired' });
        continue;
      }

      const timeWindow = req.timeWindowMinutes || 10;
      const timeMin = new Date(req.preferredTime.getTime() - timeWindow * 60_000);
      const timeMax = new Date(req.preferredTime.getTime() + timeWindow * 60_000);

      const matchQuery = {
        destinationLandmark: req.destinationLandmark,
        sourceLandmark: req.sourceLandmark,
        departureTime: { $gte: timeMin, $lte: timeMax },
        availableSeats: { $gte: 1 },
        status: 'open',
        _id: { $nin: req.notifiedRideIds || [] }
      };

      if (req.femaleOnly) matchQuery.femaleOnly = true;

      const matchingRides = await Ride.find(matchQuery);

      if (matchingRides.length > 0) {
        notifyUser(req.userId, 'ride_match_found', {
          message: `${matchingRides.length} new ride${matchingRides.length > 1 ? 's' : ''} found for your route!`,
          rides: matchingRides
        });

        await PendingRequest.findByIdAndUpdate(req._id, {
          $push: { notifiedRideIds: { $each: matchingRides.map(r => r._id) } }
        });
      }
    }
  } catch (err) {
    console.error('[Re-Notify] Sweep error:', err.message);
  }
}

// Run sweep every 2 minutes
cron.schedule('*/2 * * * *', () => {
  console.log('[Re-Notify] Sweep running...');
  sweepAllPending();
});

module.exports = {
  checkPendingForNewRide,
  sweepAllPending
};