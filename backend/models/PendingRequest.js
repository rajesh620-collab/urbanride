const mongoose = require('mongoose');

const pendingRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceLandmark: { type: String, required: true },
  destinationLandmark: { type: String, required: true },
  preferredTime: { type: Date, required: true },
  timeWindowMinutes: { type: Number, default: 60 },
  femaleOnly: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'matched', 'expired'],
    default: 'active'
  },
  notifiedRideIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
});

// MongoDB automatically deletes expired records
pendingRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Faster search index
pendingRequestSchema.index({
  status: 1,
  sourceLandmark: 1,
  destinationLandmark: 1
});

module.exports = mongoose.model('PendingRequest', pendingRequestSchema);