const Alert = require('../models/Alert');
const { getIO } = require('../services/websocketService');

exports.triggerAlert = async (req, res) => {
  try {
    const { rideId, type, location, priority } = req.body;
    const userId = req.user.id;

    const alert = await Alert.create({
      userId,
      rideId,
      type: type || 'sos',
      location,
      priority: priority || 'normal'
    });

    // Notify Admins via WebSocket (if any admin dashboard connected)
    const io = getIO();
    if (io) {
      io.emit('new_emergency_alert', {
        alertId: alert._id,
        userId,
        rideId,
        type: alert.type,
        priority: alert.priority,
        location
      });
    }

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).populate('userId', 'name phone');
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
