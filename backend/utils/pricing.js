/**
 * Pricing utilities.
 * Shared rides are cheaper than solo rides.
 */

const BASE_FARE        = 30;   // minimum fare ₹30
const PER_KM_RATE      = 12;   // ₹12 per km
const SHARED_DISCOUNT  = 0.35; // 35 % cheaper on shared rides

/**
 * Calculate solo fare based on distance.
 * @param {number} distanceMeters
 * @returns {number} fare in ₹
 */
function calculateSoloFare(distanceMeters) {
  const km = distanceMeters / 1000;
  return Math.round(BASE_FARE + km * PER_KM_RATE);
}

/**
 * Calculate shared fare (discounted).
 * @param {number} distanceMeters
 * @returns {number} fare in ₹
 */
function calculateSharedFare(distanceMeters) {
  const solo = calculateSoloFare(distanceMeters);
  return Math.round(solo * (1 - SHARED_DISCOUNT));
}

/**
 * Return both fares for comparison.
 */
function compareFares(distanceMeters) {
  const solo   = calculateSoloFare(distanceMeters);
  const shared = calculateSharedFare(distanceMeters);
  return {
    soloFare:    solo,
    sharedFare:  shared,
    savingsPercent: Math.round(SHARED_DISCOUNT * 100),
    savingsAmount:  solo - shared
  };
}

module.exports = { calculateSoloFare, calculateSharedFare, compareFares };
