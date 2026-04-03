const mongoose = require('mongoose');

const ridePoolSchema = new mongoose.Schema({
  poolCode: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'car'],
    default: 'auto'
  },
  sourceCoords: {
    lat: Number,
    lng: Number,
    address: String
  },
  destCoords: {
    lat: Number,
    lng: Number,
    address: String
  },
  distanceKm: Number,
  durationMin: Number,
  totalFare: Number,
  minParticipants: {
    type: Number,
    default: 2
  },
  maxParticipants: {
    type: Number,
    default: 4
  },
  status: {
    type: String,
    enum: ['waiting', 'finding_driver', 'driver_assigned', 'started', 'completed', 'cancelled'],
    default: 'waiting'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  driverInfo: {
    name: String,
    vehicleNumber: String,
    phone: String
  },
  otp: String,
  departureTime: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for geo-matching
ridePoolSchema.index({ 'sourceCoords.lat': 1, 'sourceCoords.lng': 1, status: 1 });
ridePoolSchema.index({ poolCode: 1 });

module.exports = mongoose.model('RidePool', ridePoolSchema);
