const cron = require('node-cron');
const PendingRequest = require('../models/PendingRequest');
const Ride = require('../models/Ride');
const { notifyUser } = require('./websocketService');

async function checkPendingRequests(newRide = null) {
  try {
    const query = { status: 'active' };

    // If triggered by a new ride, only check matching pending requests
    if (newRide) {
      query.sourceLandmark = newRide.sourceLandmark;
      query.destinationLandmark = newRide.destinationLandmark;
    }

    const pendingRequests = await PendingRequest.find(query);

    for (const req of pendingRequests) {
      const timeWindow = req.timeWindowMinutes || 60;
      const timeMin = new Date(req.preferredTime - timeWindow * 60000);
      const timeMax = new Date(req.preferredTime + timeWindow * 60000);

      const matchQuery = {
        sourceLandmark: req.sourceLandmark,
        destinationLandmark: req.destinationLandmark,
        departureTime: { $gte: timeMin, $lte: timeMax },
        availableSeats: { $gte: 1 },
        status: 'open',
        _id: { $nin: req.notifiedRideIds }
      };

      if (req.femaleOnly) matchQuery.femaleOnly = true;

      const matchingRides = await Ride.find(matchQuery);

      if (matchingRides.length > 0) {
        notifyUser(req.userId, 'ride_match_found', {
          message: `${matchingRides.length} ride(s) found for your route!`,
          rides: matchingRides
        });

        await PendingRequest.findByIdAndUpdate(req._id, {
          $push: {
            notifiedRideIds: { $each: matchingRides.map(r => r._id) }
          }
        });
      }
    }
  } catch (err) {
    console.error('Re-notification engine error:', err.message);
  }
}

// Run automatically every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Re-notification engine checking pending requests...');
  checkPendingRequests();
});

module.exports = { checkPendingRequests };