/**
 * Geolocation utilities — Haversine formula, nearest landmark, etc.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance (in meters) between two lat/lng points.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in meters
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c * 1000; // convert km → meters
}

/**
 * Find the nearest landmark to a given lat/lng.
 * @param {number} lat
 * @param {number} lng
 * @param {Array} landmarks - [{name, lat, lng}, ...]
 * @returns {{ landmark: Object, distanceMeters: number }}
 */
function findNearestLandmark(lat, lng, landmarks) {
  let nearest = null;
  let minDist = Infinity;

  for (const lm of landmarks) {
    if (!lm.lat || !lm.lng) continue;
    const dist = haversineDistance(lat, lng, lm.lat, lm.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = lm;
    }
  }

  return { landmark: nearest, distanceMeters: Math.round(minDist) };
}

/**
 * Estimates walking time in minutes (avg walking speed 5 km/h ≈ 83m/min).
 * @param {number} distanceMeters
 * @returns {number} minutes, rounded up
 */
function estimateWalkingMinutes(distanceMeters) {
  return Math.ceil(distanceMeters / 83);
}

/**
 * Estimates driving ETA in minutes (avg city speed 25 km/h ≈ 417m/min).
 * @param {number} distanceMeters
 * @returns {number} minutes, rounded up
 */
function estimateDrivingMinutes(distanceMeters) {
  return Math.max(1, Math.ceil(distanceMeters / 417));
}

/**
 * Calculate the approximate distance between two landmarks.
 * @param {Object} from - {lat, lng}
 * @param {Object} to   - {lat, lng}
 * @returns {number} distance in meters
 */
function landmarkDistance(from, to) {
  if (!from?.lat || !to?.lat) return 0;
  return haversineDistance(from.lat, from.lng, to.lat, to.lng);
}

module.exports = {
  haversineDistance,
  findNearestLandmark,
  estimateWalkingMinutes,
  estimateDrivingMinutes,
  landmarkDistance
};
