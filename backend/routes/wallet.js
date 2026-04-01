/**
 * Wallet routes — balance, top-up, pay, transaction history
 */
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const auth = require('../middleware/auth');
const { ok, created, fail } = require('../utils/response');

// Helper: get or create wallet for a user
async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 200,
      transactions: [{
        type: 'credit',
        amount: 200,
        description: 'Welcome bonus from UrbanRide!'
      }]
    });
  }
  return wallet;
}

// GET /api/wallet — get balance + recent transactions
router.get('/', auth, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    const recent = wallet.transactions.slice(-20).reverse();
    return ok(res, {
      message: 'Wallet fetched',
      data: { balance: wallet.balance, transactions: recent }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/wallet/topup — add money (mock)
router.post('/topup', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return fail(res, 400, 'Invalid amount');
    if (amount > 10000) return fail(res, 400, 'Max top-up ₹10,000 at once');

    const wallet = await getOrCreateWallet(req.user.id);
    wallet.balance += amount;
    wallet.transactions.push({
      type: 'credit',
      amount,
      description: `Wallet top-up of ₹${amount}`
    });
    await wallet.save();

    return ok(res, {
      message: `₹${amount} added to your wallet`,
      data: { balance: wallet.balance }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/wallet/pay — pay for a ride
router.post('/pay', auth, async (req, res) => {
  try {
    const { amount, rideId, description } = req.body;
    if (!amount || amount <= 0) return fail(res, 400, 'Invalid amount');

    const wallet = await getOrCreateWallet(req.user.id);
    if (wallet.balance < amount) {
      return fail(res, 400, `Insufficient balance. Your balance: ₹${wallet.balance}`);
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'debit',
      amount,
      description: description || `Ride payment of ₹${amount}`,
      rideId
    });
    await wallet.save();

    return ok(res, {
      message: `₹${amount} paid successfully`,
      data: { balance: wallet.balance }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

module.exports = router;
