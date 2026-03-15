const express = require('express');
const router = express.Router();
const PendingRequest = require('../models/PendingRequest');
const auth = require('../middleware/auth');

// POST /api/pending — save a pending request when no ride found
router.post('/', auth, async (req, res) => {
  try {
    const { sourceLandmark, destinationLandmark, preferredTime, femaleOnly } = req.body;

    // Check if same request already exists
    const existing = await PendingRequest.findOne({
      userId: req.user.id,
      sourceLandmark,
      destinationLandmark,
      status: 'active'
    });

    if (existing) {
      return res.status(400).json({ message: 'You already have an active request for this route' });
    }

    const request = await PendingRequest.create({
      userId: req.user.id,
      sourceLandmark,
      destinationLandmark,
      preferredTime,
      femaleOnly: femaleOnly || false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/pending/my — get user's active pending requests
router.get('/my', auth, async (req, res) => {
  try {
    const requests = await PendingRequest.find({
      userId: req.user.id,
      status: 'active'
    });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/pending/:id — cancel a pending request
router.delete('/:id', auth, async (req, res) => {
  try {
    await PendingRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pending request removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;