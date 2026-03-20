const express = require('express');
const router = express.Router();
const RidePool = require('../models/RidePool');
const auth = require('../middleware/auth');
const { ok, created, fail } = require('../utils/response');

// Generate unique 6-character pool code
const generatePoolCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// POST /api/pools/create
router.post('/create', auth, async (req, res) => {
    try {
        const { sourceLandmark, destinationLandmark, sourceCoords, destCoords, maxParticipants } = req.body;

        if (!sourceLandmark || !destinationLandmark) {
            return fail(res, 400, 'Source and destination landmarks are required');
        }

        const pool = await RidePool.create({
            poolCode: generatePoolCode(),
            sourceLandmark,
            destinationLandmark,
            sourceCoords,
            destCoords,
            leader: req.user.id,
            members: [req.user.id],
            maxParticipants: maxParticipants || 4,
            status: 'waiting'
        });

        // Use populate to return leader details
        await pool.populate('leader', 'name phone');
        await pool.populate('members', 'name phone');

        return created(res, {
            message: 'Ride pool created successfully',
            data: pool
        });
    } catch (err) {
        return fail(res, 500, 'Server error', { error: err.message });
    }
});

// POST /api/pools/join
router.post('/join', auth, async (req, res) => {
    try {
        const { poolCode } = req.body;

        if (!poolCode) return fail(res, 400, 'Pool code is required');

        const pool = await RidePool.findOne({ poolCode, status: 'waiting' });
        if (!pool) return fail(res, 404, 'Active ride pool not found with this code');

        if (pool.members.length >= pool.maxParticipants) {
            return fail(res, 400, 'Ride pool is already full');
        }

        if (pool.members.includes(req.user.id)) {
            return fail(res, 400, 'You are already a member of this pool');
        }

        pool.members.push(req.user.id);
        await pool.save();
        await pool.populate('leader members', 'name phone');

        return ok(res, {
            message: 'Joined ride pool successfully',
            data: pool
        });
    } catch (err) {
        return fail(res, 500, 'Server error', { error: err.message });
    }
});

// POST /api/pools/auto-match
router.post('/auto-match', auth, async (req, res) => {
    try {
        const { sourceLandmark, destinationLandmark, sourceCoords, destCoords } = req.body;

        // Simple matching by landmarks first
        let pool = await RidePool.findOne({
            sourceLandmark,
            destinationLandmark,
            status: 'waiting',
            $expr: { $lt: [{ $size: "$members" }, "$maxParticipants"] }
        });

        if (pool) {
            if (!pool.members.includes(req.user.id)) {
                pool.members.push(req.user.id);
                await pool.save();
            }
            await pool.populate('leader members', 'name phone');
            return ok(res, {
                message: 'Auto-matched to an existing pool',
                data: pool
            });
        }

        // If no pool found, create a new one (as leader)
        const newPool = await RidePool.create({
            poolCode: generatePoolCode(),
            sourceLandmark,
            destinationLandmark,
            sourceCoords,
            destCoords,
            leader: req.user.id,
            members: [req.user.id],
            status: 'waiting'
        });

        await newPool.populate('leader members', 'name phone');
        return ok(res, {
            message: 'No matching pool found. Created a new one.',
            data: newPool
        });
    } catch (err) {
        return fail(res, 500, 'Server error', { error: err.message });
    }
});

// POST /api/pools/:id/start
router.post('/:id/start', auth, async (req, res) => {
    try {
        const pool = await RidePool.findById(req.params.id);
        if (!pool) return fail(res, 404, 'Pool not found');

        if (pool.leader.toString() !== req.user.id) {
            return fail(res, 403, 'Only the leader can start the ride pool');
        }

        pool.status = 'active';
        await pool.save();

        return ok(res, { message: 'Ride pool is now active and visible to drivers', data: pool });
    } catch (err) {
        return fail(res, 500, 'Server error', { error: err.message });
    }
});

// GET /api/pools/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const pool = await RidePool.findById(req.params.id)
            .populate('leader members', 'name phone');
        if (!pool) return fail(res, 404, 'Pool not found');

        return ok(res, { data: pool });
    } catch (err) {
        return fail(res, 500, 'Server error', { error: err.message });
    }
});

// GET /api/pools/active-for-drivers
router.get('/active/driver-view', auth, async (req, res) => {
    try {
        // Drivers see all pools that are 'active' (started by leader)
        const pools = await RidePool.find({ status: 'active' })
            .populate('leader', 'name phone')
            .populate('members', 'name');
        
        return ok(res, { data: pools });
    } catch (err) {
        return fail(res, 500, 'Server error', { error: err.message });
    }
});

// POST /api/pools/:id/accept
router.post('/:id/accept', auth, async (req, res) => {
    try {
        const pool = await RidePool.findById(req.params.id);
        if (!pool) return fail(res, 404, 'Pool not found');

        if (pool.status !== 'active') {
            return fail(res, 400, 'Pool is not active or already picked up');
        }

        // Assign driver and update status
        pool.status = 'picked_up';
        // We could store driverId in the pool if we want to track who picked them up
        // For simplicity, let's just mark it picked_up
        await pool.save();

        return ok(res, { 
            message: 'You have accepted this ride pool. Navigate to the pickup point.',
            data: pool
        });
    } catch (err) {
        return fail(res, 500, 'Server error', { error: err.message });
    }
});

module.exports = router;
