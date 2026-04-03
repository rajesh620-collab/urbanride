const mongoose = require('mongoose');

/**
 * DriverRide — represents an on-demand ride (Rapido/Ola/Uber style)
 * separate from the ride-pool (PostRide) model.
 */
const driverRideSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverName: { type: String, required: true },
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'car'],
    required: true,
    default: 'auto'
  },

  // Passenger info
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  passengerName: { type: String, default: null },

  // Route
  pickupAddress: { type: String, required: true },
  dropAddress:   { type: String, required: true },
  pickupCoords:  { lat: Number, lng: Number },
  dropCoords:    { lat: Number, lng: Number },

  distanceKm:   { type: Number, default: 0 },
  durationMin:  { type: Number, default: 0 },
  fare:         { type: Number, required: true },

  // OTP — generated on acceptance, used to start the ride
  otp:          { type: String, default: null },
  otpVerified:  { type: Boolean, default: false },

  // Lifecycle
  status: {
    type: String,
    enum: ['requested', 'accepted', 'arrived', 'otp_verified', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },

  requestedAt:  { type: Date, default: Date.now },
  acceptedAt:   { type: Date },
  arrivedAt:    { type: Date },
  startedAt:    { type: Date },
  completedAt:  { type: Date },
  cancelledAt:  { type: Date },
}, { timestamps: true });

driverRideSchema.index({ driverId: 1, status: 1 });
driverRideSchema.index({ status: 1, vehicleType: 1 });

module.exports = mongoose.model('DriverRide', driverRideSchema);
