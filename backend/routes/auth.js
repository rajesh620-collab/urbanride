const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { ok, created, fail } = require('../utils/response');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, gender: user.gender },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Store OTPs temporarily (in memory for test environment)
const otpStore = new Map();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return fail(res, 400, 'Phone number is required');

    // Generate a fixed OTP or random 6-digit OTP (for testing, we can use 123456 or a true random one and console.log it)
    const otp = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';
    otpStore.set(phone, otp);
    
    console.log(`[Mock SMS] Sent OTP ${otp} to phone ${phone}`);
    
    return ok(res, { message: 'OTP sent successfully. For testing, use 123456.' });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, address, gender, phone, otp } = req.body;

    if (!name || !email || !gender || !phone || !otp) {
      return fail(res, 400, 'Name, email, gender, phone, and OTP are required');
    }

    if (otp !== otpStore.get(phone) && otp !== '123456') {
      return fail(res, 400, 'Invalid OTP');
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return fail(res, 400, 'Email already registered');

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return fail(res, 400, 'Phone already registered');

    const user = await User.create({ name, email, gender, phone, address });
    // After successful register, clear OTP
    otpStore.delete(phone);

    const token = generateToken(user);
    return created(res, {
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          phone: user.phone,
          address: user.address
        }
      }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, phone, otp } = req.body;

    let user;

    // Support OTP login flow
    if (phone && otp) {
      if (otp !== otpStore.get(phone) && otp !== '123456') {
        return fail(res, 400, 'Invalid OTP');
      }
      user = await User.findOne({ phone });
      if (!user) return fail(res, 404, 'User not found');
      otpStore.delete(phone);
    } 
    // Support legacy Email/Password flow
    else {
      user = await User.findOne({ email });
      if (!user) return fail(res, 400, 'Invalid email or password');

      // If user has no passwordHash (new OTP flow user), they must use OTP
      if (!user.passwordHash) {
        return fail(res, 400, 'Please login using your mobile number and OTP');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return fail(res, 400, 'Invalid email or password');
    }

    const token = generateToken(user);
    return ok(res, {
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          phone: user.phone,
          address: user.address
        }
      }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

// GET /api/auth/me — verify token & return user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return fail(res, 404, 'User not found');

    return ok(res, {
      message: 'Authenticated',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          phone: user.phone
        }
      }
    });
  } catch (err) {
    return fail(res, 500, 'Server error', { error: err.message });
  }
});

module.exports = router;