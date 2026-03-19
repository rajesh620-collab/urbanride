const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverName: { type: String, required: true },
  sourceLandmark: { type: String, required: true },
  destinationLandmark: { type: String, required: true },
  departureTime: { type: Date, default: Date.now },
  totalSeats: { type: Number, required: true, min: 1, max: 4 },
  availableSeats: { type: Number, required: true },
  femaleOnly: { type: Boolean, default: false },
  farePerSeat: { type: Number, required: true },
  status: {
    type: String,
    enum: ['open', 'full', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for fast search queries
rideSchema.index({ sourceLandmark: 1, destinationLandmark: 1, departureTime: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ femaleOnly: 1 });

module.exports = mongoose.model('Ride', rideSchema);