/**
 * Landmark routes
 *
 * GET  /api/landmarks          → list all landmarks
 * GET  /api/landmarks/nearest  → find nearest landmark to a lat/lng
 */

const express = require("express");
const router = express.Router();
const Landmark = require("../models/Landmark");
const { findNearestLandmark } = require("../utils/geo");
const { ok, fail } = require("../utils/response");

// GET /api/landmarks — list all landmarks
router.get("/", async (req, res) => {
  try {
    const { city } = req.query;
    const query = city ? { city } : {};
    const landmarks = await Landmark.find(query).sort({ name: 1 });

    return ok(res, {
      message: `${landmarks.length} landmarks found`,
      data: { landmarks }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// GET /api/landmarks/nearest?lat=17.44&lng=78.38
router.get("/nearest", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return fail(res, 400, 'lat and lng are required');
    }

    const allLandmarks = await Landmark.find({});
    const { landmark, distanceMeters } = findNearestLandmark(
      parseFloat(lat),
      parseFloat(lng),
      allLandmarks
    );

    if (!landmark) {
      return fail(res, 404, 'No landmarks found');
    }

    return ok(res, {
      message: `Nearest landmark: ${landmark.name} (${distanceMeters}m away)`,
      data: {
        landmark,
        distanceMeters
      }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

module.exports = router;