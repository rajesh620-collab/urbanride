const mongoose = require('mongoose');

const ridePoolSchema = new mongoose.Schema({
  poolCode: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },
  sourceLandmark: { type: String, required: true },
  destinationLandmark: { type: String, required: true },
  sourceCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  destCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    default: 4
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'picked_up', 'completed', 'cancelled'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geo-matching (simplified for landmarks first)
ridePoolSchema.index({ sourceLandmark: 1, destinationLandmark: 1, status: 1 });
ridePoolSchema.index({ poolCode: 1 });

module.exports = mongoose.model('RidePool', ridePoolSchema);
