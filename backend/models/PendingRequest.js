const mongoose = require('mongoose');

const pendingRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceLandmark:      { type: String, required: true },
  destinationLandmark: { type: String, required: true },
  preferredTime:       { type: Date, required: true },
  timeWindowMinutes:   { type: Number, default: 10 },   // ±10 min match window
  femaleOnly:          { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'matched', 'expired'],
    default: 'active'
  },
  notifiedRideIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5-minute urgent TTL
  }
});

// MongoDB TTL index: automatically deletes expired documents
pendingRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast matching queries
pendingRequestSchema.index({
  status: 1,
  destinationLandmark: 1,
  sourceLandmark: 1
});

module.exports = mongoose.model('PendingRequest', pendingRequestSchema);