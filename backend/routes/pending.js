/**
 * Pending request routes
 *
 * POST   /api/pending     → create pending ride request
 * GET    /api/pending/my  → get user's active requests
 * DELETE /api/pending/:id → cancel a pending request
 */

const express = require('express');
const router = express.Router();
const PendingRequest = require('../models/PendingRequest');
const auth = require('../middleware/auth');
const { ok, created, fail } = require('../utils/response');

// POST /api/pending
router.post('/', auth, async (req, res) => {
  try {
    const { sourceLandmark, destinationLandmark, preferredTime, femaleOnly } = req.body;

    if (!sourceLandmark || !destinationLandmark) {
      return fail(res, 400, 'Source and destination landmarks are required');
    }

    const existing = await PendingRequest.findOne({
      userId: req.user.id,
      sourceLandmark,
      destinationLandmark,
      status: 'active'
    });

    if (existing) {
      return fail(res, 400, 'You already have an active request for this route');
    }

    const request = await PendingRequest.create({
      userId: req.user.id,
      sourceLandmark,
      destinationLandmark,
      preferredTime: preferredTime || new Date(),
      femaleOnly: femaleOnly || false,
      timeWindowMinutes: 10,
      expiresAt: new Date(Date.now() + 5 * 60_000) // 5-minute urgent TTL
    });

    return created(res, {
      message: 'Pending request created — we\'ll notify you when a match is found',
      data: { request }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// GET /api/pending/my
router.get('/my', auth, async (req, res) => {
  try {
    const requests = await PendingRequest.find({
      userId: req.user.id,
      status: 'active'
    }).sort({ createdAt: -1 });

    return ok(res, {
      message: `${requests.length} active request(s)`,
      data: { requests }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// DELETE /api/pending/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await PendingRequest.findById(req.params.id);
    if (!request) return fail(res, 404, 'Pending request not found');

    if (String(request.userId) !== String(req.user.id)) {
      return fail(res, 403, 'Not your request');
    }

    await PendingRequest.findByIdAndDelete(req.params.id);
    return ok(res, { message: 'Pending request removed' });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

module.exports = router;