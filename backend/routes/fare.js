/**
 * Fare estimation routes
 *
 * POST /api/fare/estimate — get smart fare for a route
 */

const express = require('express');
const router = express.Router();
const Landmark = require('../models/Landmark');
const { haversineDistance } = require('../utils/geo');
const { calculateSmartFare } = require('../utils/fareEngine');
const { ok, fail } = require('../utils/response');

// POST /api/fare/estimate
router.post('/estimate', async (req, res) => {
  try {
    const { sourceLandmark, destinationLandmark, sourceLat, sourceLng, destLat, destLng } = req.body;

    let distanceMeters;

    // If coordinates are provided directly
    if (sourceLat && sourceLng && destLat && destLng) {
      distanceMeters = haversineDistance(
        parseFloat(sourceLat), parseFloat(sourceLng),
        parseFloat(destLat), parseFloat(destLng)
      );
    }
    // If landmark names are provided, look up their coordinates
    else if (sourceLandmark && destinationLandmark) {
      const landmarks = await Landmark.find({
        name: { $in: [sourceLandmark, destinationLandmark] }
      });

      const src = landmarks.find(l => l.name === sourceLandmark);
      const dst = landmarks.find(l => l.name === destinationLandmark);

      if (!src || !dst) {
        return fail(res, 400, 'One or both landmarks not found');
      }

      distanceMeters = haversineDistance(src.lat, src.lng, dst.lat, dst.lng);
    } else {
      return fail(res, 400, 'Provide landmark names or coordinates');
    }

    const fareEstimate = await calculateSmartFare({
      distanceMeters,
      isSplit: true
    });

    return ok(res, {
      message: 'Fare estimated successfully',
      data: fareEstimate
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

module.exports = router;
