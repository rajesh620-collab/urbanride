const mongoose = require('mongoose');

const savedRouteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  label: { type: String, required: true }, // e.g. "Home", "Office"
  sourceLandmark: { type: String, required: true },
  destinationLandmark: { type: String, required: true },
  sourceCoords: { lat: Number, lng: Number },
  destCoords: { lat: Number, lng: Number },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

savedRouteSchema.index({ userId: 1 });

module.exports = mongoose.model('SavedRoute', savedRouteSchema);
