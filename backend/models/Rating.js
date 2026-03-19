const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  role: {
    type: String,
    enum: ['driver', 'passenger'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// One rating per user-pair per ride
ratingSchema.index({ rideId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });
ratingSchema.index({ toUserId: 1 });

module.exports = mongoose.model('Rating', ratingSchema);
