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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender, phone } = req.body;

    if (!name || !email || !password || !gender) {
      return fail(res, 400, 'Name, email, password, and gender are required');
    }

    if (password.length < 6) {
      return fail(res, 400, 'Password must be at least 6 characters');
    }

    const existing = await User.findOne({ email });
    if (existing) return fail(res, 400, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, gender, phone });

    const token = generateToken(user);
    return created(res, {
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender
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
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return fail(res, 400, 'Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return fail(res, 400, 'Invalid email or password');

    const token = generateToken(user);
    return ok(res, {
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender
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