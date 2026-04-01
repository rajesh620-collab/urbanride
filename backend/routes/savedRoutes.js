/**
 * Saved Routes — star/bookmark frequently used routes
 */
const express = require('express');
const router = express.Router();
const SavedRoute = require('../models/SavedRoute');
const auth = require('../middleware/auth');
const { ok, created, fail } = require('../utils/response');

// GET /api/saved-routes
router.get('/', auth, async (req, res) => {
  try {
    const routes = await SavedRoute.find({ userId: req.user.id }).sort({ usageCount: -1 });
    return ok(res, { data: { routes } });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/saved-routes
router.post('/', auth, async (req, res) => {
  try {
    const { label, sourceLandmark, destinationLandmark, sourceCoords, destCoords } = req.body;
    if (!sourceLandmark || !destinationLandmark) {
      return fail(res, 400, 'Source and destination are required');
    }
    // Prevent duplicates
    const existing = await SavedRoute.findOne({
      userId: req.user.id,
      sourceLandmark,
      destinationLandmark
    });
    if (existing) return fail(res, 400, 'This route is already saved');

    const route = await SavedRoute.create({
      userId: req.user.id,
      label: label || `${sourceLandmark} → ${destinationLandmark}`,
      sourceLandmark,
      destinationLandmark,
      sourceCoords,
      destCoords
    });
    return created(res, { message: 'Route saved!', data: { route } });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// DELETE /api/saved-routes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await SavedRoute.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    return ok(res, { message: 'Route removed' });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// PATCH /api/saved-routes/:id/use — increment usage count
router.patch('/:id/use', auth, async (req, res) => {
  try {
    await SavedRoute.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });
    return ok(res, { message: 'Usage tracked' });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

module.exports = router;
