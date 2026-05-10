const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RidePool',
    required: true
  },
  type: {
    type: String,
    enum: ['sos', 'share', 'audio_record'],
    default: 'sos'
  },
  priority: {
    type: String,
    enum: ['normal', 'high'],
    default: 'normal'
  },
  location: {
    lat: Number,
    lng: Number
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Alert', alertSchema);
