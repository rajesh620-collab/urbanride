/**
 * Smart Fare Engine
 * Dynamically calculates fare based on:
 * - Distance (base + per-km rate)
 * - Time of day (peak vs off-peak)
 * - Demand (surge pricing)
 * - Ride split discount
 */

const Ride = require('../models/Ride');
const PendingRequest = require('../models/PendingRequest');

const BASE_FARE = 30;        // ₹30 minimum
const PER_KM_RATE = 12;      // ₹12 per km
const MIN_FARE = 25;         // absolute minimum
const MAX_ADJUSTMENT = 0.15; // users can adjust ±15% from suggested

// Peak hour multipliers
const PEAK_HOURS = [
  { start: 7, end: 10, multiplier: 1.25 },   // morning rush
  { start: 17, end: 20, multiplier: 1.20 },   // evening rush
  { start: 22, end: 6, multiplier: 1.10 },    // late night
];

/**
 * Get time-of-day multiplier
 */
function getTimeMultiplier(date = new Date()) {
  const hour = date.getHours();
  for (const peak of PEAK_HOURS) {
    if (peak.start < peak.end) {
      if (hour >= peak.start && hour < peak.end) return peak.multiplier;
    } else {
      // overnight range (e.g., 22 to 6)
      if (hour >= peak.start || hour < peak.end) return peak.multiplier;
    }
  }
  return 1.0; // off-peak
}

/**
 * Get time period label
 */
function getTimePeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 7 && hour < 10) return 'Morning Rush';
  if (hour >= 17 && hour < 20) return 'Evening Rush';
  if (hour >= 22 || hour < 6) return 'Late Night';
  return 'Off-Peak';
}

/**
 * Get demand multiplier based on active rides vs pending requests
 */
async function getDemandMultiplier() {
  try {
    const [activeRides, pendingRequests] = await Promise.all([
      Ride.countDocuments({ status: 'open' }),
      PendingRequest.countDocuments({ status: 'active' })
    ]);

    if (activeRides === 0) return { multiplier: 1.3, label: 'High Demand' };

    const ratio = pendingRequests / activeRides;
    if (ratio > 3) return { multiplier: 1.4, label: 'Very High Demand' };
    if (ratio > 2) return { multiplier: 1.25, label: 'High Demand' };
    if (ratio > 1) return { multiplier: 1.1, label: 'Moderate Demand' };
    return { multiplier: 1.0, label: 'Normal' };
  } catch {
    return { multiplier: 1.0, label: 'Normal' };
  }
}

/**
 * Calculate smart fare with all factors
 */
async function calculateSmartFare({ distanceMeters, isSplit = true }) {
  const distanceKm = distanceMeters / 1000;
  const baseFare = BASE_FARE;
  const distanceCharge = Math.round(distanceKm * PER_KM_RATE);

  const timeMultiplier = getTimeMultiplier();
  const timePeriod = getTimePeriod();
  const { multiplier: demandMultiplier, label: demandLabel } = await getDemandMultiplier();

  // Calculate raw fare
  let rawFare = (baseFare + distanceCharge) * timeMultiplier * demandMultiplier;

  // Apply split discount
  const splitDiscount = isSplit ? 0.35 : 0;
  const splitSavings = Math.round(rawFare * splitDiscount);
  const suggestedFare = Math.max(MIN_FARE, Math.round(rawFare - splitSavings));

  // Calculate adjustment range
  const minFare = Math.max(MIN_FARE, Math.round(suggestedFare * (1 - MAX_ADJUSTMENT)));
  const maxFare = Math.round(suggestedFare * (1 + MAX_ADJUSTMENT));

  // Solo fare for comparison
  const soloFare = Math.round((baseFare + distanceCharge) * timeMultiplier * demandMultiplier);

  return {
    suggestedFare,
    minFare,
    maxFare,
    soloFare,
    breakdown: {
      baseFare,
      distanceCharge,
      distanceKm: +distanceKm.toFixed(1),
      timeMultiplier: +timeMultiplier.toFixed(2),
      timePeriod,
      demandMultiplier: +demandMultiplier.toFixed(2),
      demandLabel,
      splitDiscount: Math.round(splitDiscount * 100),
      splitSavings,
    },
    savingsVsSolo: soloFare - suggestedFare,
    savingsPercent: Math.round(((soloFare - suggestedFare) / soloFare) * 100)
  };
}

module.exports = {
  calculateSmartFare,
  getTimeMultiplier,
  getTimePeriod,
  getDemandMultiplier
};
