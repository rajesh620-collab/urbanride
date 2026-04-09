const RidePool = require('../models/RidePool');
const User = require('../models/User');
const DriverRide = require('../models/DriverRide'); // We can reuse some logic or keep it separate
const { notifyUser, notifyUserByModel } = require('../services/websocketService');
const crypto = require('crypto');

// Helper for fare split
const calculateBaseFare = (km, type) => {
  const rates = { bike: 12, auto: 18, car: 25 };
  return 30 + (km * (rates[type] || 18));
};

exports.createPool = async (req, res) => {
  try {
    const { sourceCoords, destCoords, vehicleType, distanceKm, durationMin, maxParticipants, departureTime } = req.body;
    const userId = req.user?.id || req.user?._id || req.userId;

    if (!userId) {
       return res.status(401).json({ success: false, message: 'User identification failed. Please re-login.' });
    }
    
    // Check if user already in a waiting/finding pool
    const existing = await RidePool.findOne({
      status: { $in: ['waiting', 'finding_driver', 'driver_assigned', 'started'] },
      'members.user': userId
    });
    if (existing) return res.status(400).json({ success: false, message: 'You are already in an active pool' });

    const poolCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const totalFare = calculateBaseFare(distanceKm || 5, vehicleType || 'auto');

    const pool = await RidePool.create({
      poolCode,
      creator: userId,
      members: [{ user: userId, joinedAt: Date.now() }],
      vehicleType: vehicleType || 'auto',
      sourceCoords,
      destCoords,
      distanceKm: distanceKm || 5,
      durationMin: durationMin || 15,
      totalFare,
      maxParticipants: maxParticipants || 4,
      departureTime: departureTime || new Date(),
      status: 'waiting'
    });

    res.status(201).json({ success: true, data: pool });
  } catch (error) {
    if (error.name === 'ValidationError') {
       const msgs = Object.values(error.errors).map(e => e.message);
       return res.status(400).json({ success: false, message: `Validation failed: ${msgs.join(', ')}` });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinPool = async (req, res) => {
  try {
    const { poolId } = req.params;
    const pool = await RidePool.findById(poolId);
    if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' });
    if (pool.status !== 'waiting') return res.status(400).json({ success: false, message: 'Pool is no longer joining' });
    if (pool.members.length >= pool.maxParticipants) return res.status(400).json({ success: false, message: 'Pool is full' });

    const userId = req.user?.id || req.user?._id || req.userId;

    // Check if user already a member
    if (pool.members.some(m => m.user.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'Already joined' });
    }
 
    pool.members.push({ user: userId, joinedAt: Date.now() });
    await pool.save();

    // Broadcast update to all current members
    pool.members.forEach(m => {
      notifyUserByModel(m.user.toString(), 'pool_joined', { poolId: pool._id, passengerCount: pool.members.length });
    });

    // Check if we should start finding a driver (min 2 passengers)
    if (pool.members.length >= pool.minParticipants) {
      await triggerDriverSearch(pool);
    }

    res.json({ success: true, data: pool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchPools = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // km
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Coords required' });

    // Find waiting pools near pickup
    // (In production use $near, for now simple range check)
    const pools = await RidePool.find({
      status: 'waiting',
      'sourceCoords.lat': { $gt: lat - 0.05, $lt: parseFloat(lat) + 0.05 },
      'sourceCoords.lng': { $gt: lng - 0.05, $lt: parseFloat(lng) + 0.05 }
    }).populate('creator', 'name gender');

    res.json({ success: true, data: { pools } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const triggerDriverSearch = async (pool) => {
  if (pool.status === 'finding_driver') return;
  
  pool.status = 'finding_driver';
  await pool.save();

  // Notify all members
  pool.members.forEach(m => {
    notifyUserByModel(m.user.toString(), 'status_updated', { poolId: pool._id, status: 'finding_driver' });
  });

  const { getIO } = require('../services/websocketService');
  const io = getIO();
  if (io) {
    io.emit('new_ride_request', {
      _id: pool._id,
      isPool: true,
      pickupAddress: pool.sourceCoords.address,
      dropAddress: pool.destCoords.address,
      fare: pool.totalFare,
      passengerCount: pool.members.length,
      vehicleType: pool.vehicleType,
      distanceKm: pool.distanceKm,
      durationMin: pool.durationMin
    });
  }
};

exports.acceptPoolRide = async (req, res) => {
  try {
    const { poolId } = req.params;
    const pool = await RidePool.findById(poolId);
    if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' });
    if (pool.status !== 'finding_driver') return res.status(400).json({ success: false, message: 'Ride already taken or cancelled' });

    const userId = req.user?.id || req.user?._id || req.userId;
    const driver = await User.findById(userId);
    pool.driver = userId;
    pool.driverInfo = {
       name: driver.name,
       vehicleNumber: `TS 0${Math.floor(Math.random()*9)} AB ${Math.floor(Math.random()*9000+1000)}`,
       phone: driver.phone
    };
    pool.status = 'driver_assigned';
    pool.otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate OTP
    await pool.save();

    // Notify all passengers
    pool.members.forEach(m => {
      notifyUserByModel(m.user.toString(), 'driver_assigned', {
        poolId: pool._id,
        driver: pool.driverInfo,
        otp: pool.otp,
        farePerPerson: pool.totalFare / pool.members.length
      });
    });

    res.json({ success: true, data: pool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPoolStatus = async (req, res) => {
   try {
     const pool = await RidePool.findById(req.params.poolId).populate('members.user', 'name gender');
     if (!pool) return res.status(404).json({ success: false, message: 'Not found' });
     res.json({ success: true, data: pool });
   } catch (error) {
     res.status(500).json({ success: false, message: error.message });
   }
};

exports.getPoolByCode = async (req, res) => {
    try {
      const pool = await RidePool.findOne({ poolCode: req.params.code, status: 'waiting' });
      if (!pool) return res.status(404).json({ success: false, message: 'Pool not found or no longer active' });
      res.json({ success: true, data: pool });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyPools = async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id || req.userId;
      const pools = await RidePool.find({ 'members.user': userId })
        .populate('creator', 'name gender')
        .sort({ departureTime: -1 });
  
      res.json({ success: true, data: { pools } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

// Monitor function to trigger driver search for pools waiting > 30s
exports.monitorPools = async () => {
    const threshold = new Date(Date.now() - 30 * 1000);
    const stalePools = await RidePool.find({
        status: 'waiting',
        createdAt: { $lt: threshold }
    });
    for (let pool of stalePools) {
        await triggerDriverSearch(pool);
    }
};
