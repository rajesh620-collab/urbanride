const DriverRide = require('../models/DriverRide');
const { notifyUser, notifyRideRoom } = require('../services/websocketService');

/** Helper: generate 4-digit OTP */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Helper: fare rates per km */
const FARE_RATES = { bike: 8, auto: 12, car: 18 };
const BASE_FARES  = { bike: 20, auto: 30, car: 50 };

/**
 * POST /api/driver-rides
 * Create a new ride request (simulated — in production, passengers create these)
 */
exports.createRide = async (req, res) => {
  try {
    const {
      vehicleType = 'auto',
      pickupAddress, dropAddress,
      pickupCoords, dropCoords,
      distanceKm = 5, durationMin = 15,
    } = req.body;

    const rate = FARE_RATES[vehicleType] || 12;
    const base = BASE_FARES[vehicleType] || 30;
    const fare = Math.round(base + distanceKm * rate);

    const ride = await DriverRide.create({
      driverId: req.user.id,
      driverName: req.user.name,
      vehicleType,
      pickupAddress: pickupAddress || 'Unknown Pickup',
      dropAddress:   dropAddress   || 'Unknown Drop',
      pickupCoords:  pickupCoords  || {},
      dropCoords:    dropCoords    || {},
      distanceKm,
      durationMin,
      fare,
      status: 'requested',
    });

    res.status(201).json({ success: true, data: { ride } });
  } catch (err) {
    console.error('[createRide]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/driver-rides/my
 * Driver's own rides (all statuses)
 */
exports.getMyRides = async (req, res) => {
  try {
    const rides = await DriverRide.find({ driverId: req.user.id })
      .sort({ requestedAt: -1 })
      .limit(50);
    res.json({ success: true, data: { rides } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/driver-rides/available
 * Get pending ride requests that any driver can accept
 * (filtered by vehicle type if provided)
 */
exports.getAvailableRides = async (req, res) => {
  try {
    const { vehicleType } = req.query;
    const filter = { status: 'requested' };
    if (vehicleType) filter.vehicleType = vehicleType;

    const rides = await DriverRide.find(filter)
      .sort({ requestedAt: -1 })
      .limit(20);
    res.json({ success: true, data: { rides } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/driver-rides/:id
 * Get a single ride by ID
 */
exports.getRideById = async (req, res) => {
  try {
    const ride = await DriverRide.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    res.json({ success: true, data: { ride } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/driver-rides/:id/accept
 * Driver accepts the ride → generates OTP
 */
exports.acceptRide = async (req, res) => {
  try {
    const ride = await DriverRide.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Ride is no longer available' });
    }

    const otp = generateOTP();
    ride.status = 'accepted';
    ride.driverId = req.user.id;
    ride.driverName = req.user.name;
    ride.otp = otp;
    ride.acceptedAt = new Date();
    await ride.save();

    // Notify passenger if online
    if (ride.passengerId) {
      notifyUser(ride.passengerId, 'ride_accepted', {
        rideId: ride._id,
        otp,
        driverName: req.user.name,
        message: `${req.user.name} has accepted your ride! OTP: ${otp}`,
      });
    }

    res.json({ success: true, data: { ride, otp } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/driver-rides/:id/arrived
 * Driver marks arrival at pickup
 */
exports.markArrived = async (req, res) => {
  try {
    const ride = await DriverRide.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot mark arrived at this stage' });
    }
    if (String(ride.driverId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not your ride' });
    }

    ride.status = 'arrived';
    ride.arrivedAt = new Date();
    await ride.save();

    if (ride.passengerId) {
      notifyUser(ride.passengerId, 'driver_arrived', {
        rideId: ride._id,
        message: 'Your driver has arrived! Please share the OTP to start the ride.',
      });
    }

    res.json({ success: true, data: { ride } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/driver-rides/:id/verify-otp
 * Driver enters OTP to start the ride
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const ride = await DriverRide.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (!['accepted', 'arrived'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'OTP not required at this stage' });
    }
    if (String(ride.driverId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not your ride' });
    }
    if (ride.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    ride.status = 'in_progress';
    ride.otpVerified = true;
    ride.startedAt = new Date();
    await ride.save();

    if (ride.passengerId) {
      notifyUser(ride.passengerId, 'ride_started', {
        rideId: ride._id,
        message: 'Your ride has started!',
      });
    }

    res.json({ success: true, data: { ride } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/driver-rides/:id/complete
 */
exports.completeRide = async (req, res) => {
  try {
    const ride = await DriverRide.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Ride is not in progress' });
    }
    if (String(ride.driverId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not your ride' });
    }

    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save();

    if (ride.passengerId) {
      notifyUser(ride.passengerId, 'ride_completed', {
        rideId: ride._id,
        fare: ride.fare,
        message: `Ride completed! Total fare: ₹${ride.fare}`,
      });
    }

    res.json({ success: true, data: { ride } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/driver-rides/:id/cancel
 */
exports.cancelRide = async (req, res) => {
  try {
    const ride = await DriverRide.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Ride already ended' });
    }
    if (String(ride.driverId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not your ride' });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    await ride.save();

    res.json({ success: true, data: { ride } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/driver-rides/earnings
 * Driver's earnings summary
 */
exports.getEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allCompleted, todayCompleted] = await Promise.all([
      DriverRide.find({ driverId, status: 'completed' }),
      DriverRide.find({ driverId, status: 'completed', completedAt: { $gte: today } }),
    ]);

    const totalEarnings   = allCompleted.reduce((s, r) => s + (r.fare || 0), 0);
    const todayEarnings   = todayCompleted.reduce((s, r) => s + (r.fare || 0), 0);
    const totalRides      = allCompleted.length;
    const todayRides      = todayCompleted.length;

    // Last 7 rides
    const recentRides = allCompleted.slice(-7).reverse();

    res.json({
      success: true,
      data: {
        totalEarnings,
        todayEarnings,
        totalRides,
        todayRides,
        recentRides,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/driver-rides/simulate-request
 * Simulate an incoming ride request (for demo/testing)
 */
exports.simulateRequest = async (req, res) => {
  try {
    const { vehicleType = 'auto' } = req.body;

    const pickups = [
      'Connaught Place, New Delhi',
      'MG Road, Bangalore',
      'Park Street, Kolkata',
      'Bandra West, Mumbai',
      'T Nagar, Chennai',
    ];
    const drops = [
      'India Gate, New Delhi',
      'Indiranagar, Bangalore',
      'Salt Lake, Kolkata',
      'Andheri East, Mumbai',
      'Anna Nagar, Chennai',
    ];

    const distanceKm = parseFloat((3 + Math.random() * 12).toFixed(1));
    const durationMin = Math.round(distanceKm * 3.5);
    const rate = FARE_RATES[vehicleType] || 12;
    const base = BASE_FARES[vehicleType] || 30;
    const fare = Math.round(base + distanceKm * rate);

    const idx = Math.floor(Math.random() * pickups.length);
    const ride = await DriverRide.create({
      driverId: req.user.id, // will be overwritten on accept
      driverName: 'Waiting',
      vehicleType,
      pickupAddress: pickups[idx],
      dropAddress:   drops[Math.floor(Math.random() * drops.length)],
      distanceKm,
      durationMin,
      fare,
      status: 'requested',
      passengerName: ['Priya S', 'Rahul K', 'Anjali M', 'Karthik V', 'Sneha R'][Math.floor(Math.random() * 5)],
    });

    res.status(201).json({ success: true, data: { ride } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
