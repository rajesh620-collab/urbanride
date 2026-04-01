const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  passengerName: { type: String, required: true },
  seatsBooked: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'accepted_by_driver', 'confirmed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  bookedAt: { type: Date, default: Date.now }
});

bookingSchema.index({ rideId: 1 });
bookingSchema.index({ passengerId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);