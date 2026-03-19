/**
 * SmartRide matching service.
 *
 * Core logic:
 * 1. Exact match: same source + same destination → direct shared ride
 * 2. Detour match: ride going A→Z, user at B→Z, B is on/near A→Z route → join with detour
 * 3. Walking match: user can walk to a nearby source landmark
 * 4. Solo fallback: no shared rides available
 */

const Ride = require('../models/Ride');
const Landmark = require('../models/Landmark');
const { haversineDistance, estimateWalkingMinutes, landmarkDistance } = require('../utils/geo');
const { compareFares } = require('../utils/pricing');

const WALKING_THRESHOLD_M = 300;  // max walking distance to suggest
const DETOUR_THRESHOLD_M  = 3000; // max detour distance (3km) for smart matching

/**
 * Smart ride search:
 * - finds exact shared rides, detour rides, walking options, or a solo fallback.
 */
async function smartSearch({
  destinationLandmark,
  sourceLandmark,
  userLat,
  userLng,
  femaleOnly
}) {
  const allLandmarks = await Landmark.find({});

  // ── 1. Build base query for exact match ──────────────────────
  const query = {
    status: 'open',
    availableSeats: { $gte: 1 },
    destinationLandmark
  };

  if (sourceLandmark) query.sourceLandmark = sourceLandmark;
  if (femaleOnly) query.femaleOnly = true;

  // ── 2. Exact-match shared rides ──────────────────────────────
  const exactRides = await Ride.find(query).sort({ createdAt: -1 }).limit(10);

  if (exactRides.length > 0) {
    const pricing = await calculatePricingBetween(
      sourceLandmark || exactRides[0].sourceLandmark,
      destinationLandmark
    );
    return {
      type: 'shared',
      message: `${exactRides.length} shared ride${exactRides.length > 1 ? 's' : ''} available`,
      rides: exactRides,
      pricing
    };
  }

  // ── 3. DETOUR MATCHING (new!) ────────────────────────────────
  // Person X: A → Z, Person Y: B → Z
  // If B lies within a minimal detour from A's route to Z → join
  if (sourceLandmark) {
    const detourResult = await findDetourRides({
      sourceLandmark,
      destinationLandmark,
      allLandmarks,
      femaleOnly
    });
    if (detourResult) return detourResult;
  }

  // ── 4. Walking-distance shared rides (GPS) ───────────────────
  if (userLat && userLng) {
    const walkOption = await findWalkableRides({
      destinationLandmark,
      userLat,
      userLng,
      allLandmarks,
      femaleOnly
    });
    if (walkOption) return walkOption;
  }

  // ── 5. Nearby source landmark rides ──────────────────────────
  if (sourceLandmark) {
    const nearbyResult = await findNearbySourceRides({
      sourceLandmark,
      destinationLandmark,
      allLandmarks,
      femaleOnly
    });
    if (nearbyResult) return nearbyResult;
  }

  // ── 6. Fallback: solo ride ───────────────────────────────────
  const pricing = sourceLandmark
    ? await calculatePricingBetween(sourceLandmark, destinationLandmark)
    : null;

  return {
    type: 'solo',
    message: 'No shared rides available — solo ride ready',
    rides: [],
    soloOption: {
      available: true,
      destinationLandmark,
      sourceLandmark: sourceLandmark || null,
      estimatedFare: pricing?.soloFare || null
    },
    pricing
  };
}

/**
 * DETOUR MATCHING:
 * For a ride going A→Z, check if user's source B is "on the way" with minimal detour.
 *
 * detour = dist(A,B) + dist(B,Z) - dist(A,Z)
 * If detour ≤ DETOUR_THRESHOLD → it's on the way
 */
async function findDetourRides({ sourceLandmark, destinationLandmark, allLandmarks, femaleOnly }) {
  const userSrc = allLandmarks.find(l => l.name === sourceLandmark);
  const destLm  = allLandmarks.find(l => l.name === destinationLandmark);
  if (!userSrc?.lat || !destLm?.lat) return null;

  // Find all open rides going to the same destination (from ANY source)
  const query = {
    status: 'open',
    availableSeats: { $gte: 1 },
    destinationLandmark,
    sourceLandmark: { $ne: sourceLandmark } // different source (exact match already checked)
  };
  if (femaleOnly) query.femaleOnly = true;

  const rides = await Ride.find(query).sort({ createdAt: -1 });
  if (rides.length === 0) return null;

  const detourRides = [];

  for (const ride of rides) {
    const rideSrc = allLandmarks.find(l => l.name === ride.sourceLandmark);
    if (!rideSrc?.lat) continue;

    // Direct route: A → Z
    const directDist = haversineDistance(rideSrc.lat, rideSrc.lng, destLm.lat, destLm.lng);
    // Detour route: A → B → Z
    const detourDist =
      haversineDistance(rideSrc.lat, rideSrc.lng, userSrc.lat, userSrc.lng) +
      haversineDistance(userSrc.lat, userSrc.lng, destLm.lat, destLm.lng);

    const extraDetour = detourDist - directDist;

    if (extraDetour <= DETOUR_THRESHOLD_M) {
      detourRides.push({
        ride,
        detourMeters: Math.round(extraDetour),
        detourMinutes: Math.max(1, Math.ceil(extraDetour / 417)), // ~25 km/h city speed
        rideSource: ride.sourceLandmark
      });
    }
  }

  if (detourRides.length === 0) return null;

  // Sort by smallest detour first
  detourRides.sort((a, b) => a.detourMeters - b.detourMeters);
  const best = detourRides[0];

  return {
    type: 'detour',
    message: `${detourRides.length} shared ride${detourRides.length > 1 ? 's' : ''} with minimal detour (${best.detourMeters}m extra)`,
    rides: detourRides.map(d => d.ride),
    detourInfo: {
      bestDetourMeters: best.detourMeters,
      bestDetourMinutes: best.detourMinutes,
      bestRideSource: best.rideSource,
      alternativeCount: detourRides.length
    },
    pricing: await calculatePricingBetween(sourceLandmark, destinationLandmark)
  };
}

/**
 * Find shared rides whose source landmark is within WALKING_THRESHOLD of the user.
 */
async function findWalkableRides({ destinationLandmark, userLat, userLng, allLandmarks, femaleOnly }) {
  const query = {
    status: 'open',
    availableSeats: { $gte: 1 },
    destinationLandmark
  };
  if (femaleOnly) query.femaleOnly = true;

  const rides = await Ride.find(query).sort({ createdAt: -1 });

  const walkableRides = [];
  for (const ride of rides) {
    const srcLandmark = allLandmarks.find(l => l.name === ride.sourceLandmark);
    if (!srcLandmark?.lat) continue;

    const dist = haversineDistance(userLat, userLng, srcLandmark.lat, srcLandmark.lng);
    if (dist <= WALKING_THRESHOLD_M) {
      walkableRides.push({
        ride,
        walkingDistanceMeters: Math.round(dist),
        walkingTimeMinutes: estimateWalkingMinutes(dist),
        walkToLandmark: srcLandmark.name
      });
    }
  }

  if (walkableRides.length === 0) return null;

  walkableRides.sort((a, b) => a.walkingDistanceMeters - b.walkingDistanceMeters);
  const best = walkableRides[0];

  return {
    type: 'walking',
    message: `Walk ${best.walkingDistanceMeters}m to ${best.walkToLandmark} to join a shared ride`,
    rides: walkableRides.map(w => w.ride),
    walkingSuggestion: {
      distanceMeters: best.walkingDistanceMeters,
      timeMinutes: best.walkingTimeMinutes,
      walkToLandmark: best.walkToLandmark,
      alternatives: walkableRides.length
    },
    pricing: await calculatePricingBetween(best.walkToLandmark, destinationLandmark)
  };
}

/**
 * Find shared rides from nearby source landmarks.
 */
async function findNearbySourceRides({ sourceLandmark, destinationLandmark, allLandmarks, femaleOnly }) {
  const userSrc = allLandmarks.find(l => l.name === sourceLandmark);
  if (!userSrc?.lat) return null;

  const nearbyLandmarks = allLandmarks.filter(l => {
    if (l.name === sourceLandmark || !l.lat) return false;
    return haversineDistance(userSrc.lat, userSrc.lng, l.lat, l.lng) <= WALKING_THRESHOLD_M;
  });

  if (nearbyLandmarks.length === 0) return null;

  const query = {
    status: 'open',
    availableSeats: { $gte: 1 },
    destinationLandmark,
    sourceLandmark: { $in: nearbyLandmarks.map(l => l.name) }
  };
  if (femaleOnly) query.femaleOnly = true;

  const rides = await Ride.find(query).sort({ createdAt: -1 });
  if (rides.length === 0) return null;

  const firstSrcLm = allLandmarks.find(l => l.name === rides[0].sourceLandmark);
  const dist = firstSrcLm ? haversineDistance(userSrc.lat, userSrc.lng, firstSrcLm.lat, firstSrcLm.lng) : 0;

  return {
    type: 'walking',
    message: `Walk ${Math.round(dist)}m to ${rides[0].sourceLandmark} to join a shared ride`,
    rides,
    walkingSuggestion: {
      distanceMeters: Math.round(dist),
      timeMinutes: estimateWalkingMinutes(dist),
      walkToLandmark: rides[0].sourceLandmark,
      alternatives: rides.length
    },
    pricing: await calculatePricingBetween(rides[0].sourceLandmark, destinationLandmark)
  };
}

/**
 * Calculate pricing between two landmarks.
 */
async function calculatePricingBetween(srcName, dstName) {
  const landmarks = await Landmark.find({ name: { $in: [srcName, dstName] } });
  const src = landmarks.find(l => l.name === srcName);
  const dst = landmarks.find(l => l.name === dstName);
  if (!src || !dst) return null;
  const dist = landmarkDistance(src, dst);
  return { ...compareFares(dist), distanceKm: +(dist / 1000).toFixed(1) };
}

/**
 * Get nearby shared rides for a specific location.
 */
async function getNearbySharedRides(lat, lng, radiusMeters = 500) {
  const allLandmarks = await Landmark.find({});
  const nearbyLandmarks = allLandmarks.filter(l => {
    if (!l.lat) return false;
    return haversineDistance(lat, lng, l.lat, l.lng) <= radiusMeters;
  });

  if (nearbyLandmarks.length === 0) return [];

  const rides = await Ride.find({
    status: 'open',
    availableSeats: { $gte: 1 },
    sourceLandmark: { $in: nearbyLandmarks.map(l => l.name) }
  }).sort({ createdAt: -1 }).limit(20);

  return rides.map(ride => {
    const srcLm = nearbyLandmarks.find(l => l.name === ride.sourceLandmark);
    const dist = srcLm ? haversineDistance(lat, lng, srcLm.lat, srcLm.lng) : 0;
    return {
      ride,
      distanceMeters: Math.round(dist),
      walkingTimeMinutes: estimateWalkingMinutes(dist)
    };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

module.exports = {
  smartSearch,
  getNearbySharedRides,
  calculatePricingBetween
};
