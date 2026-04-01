const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  createdAt: { type: Date, default: Date.now }
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: { type: Number, default: 200 }, // Start with ₹200 welcome bonus
  transactions: [transactionSchema]
}, { timestamps: true });

walletSchema.index({ userId: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
