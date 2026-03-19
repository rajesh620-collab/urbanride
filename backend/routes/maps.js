/**
 * Maps/Geocoding routes (using free OpenStreetMap / Nominatim)
 *
 * GET  /api/maps/reverse-geocode  — lat/lng → address
 * GET  /api/maps/search           — text → locations
 * GET  /api/maps/route            — get route between two points (OSRM)
 */

const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/response');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * GET /api/maps/reverse-geocode?lat=17.44&lng=78.38
 * Returns readable address from coordinates
 */
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return fail(res, 400, 'lat and lng are required');

    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UrbanRide/1.0' }
    });
    const data = await response.json();

    if (data.error) return fail(res, 404, 'Location not found');

    const addr = data.address || {};
    const parts = [
      addr.road || addr.pedestrian || addr.suburb,
      addr.neighbourhood || addr.suburb || addr.city_district,
      addr.city || addr.town || addr.village
    ].filter(Boolean);

    return ok(res, {
      message: 'Location found',
      data: {
        displayName: data.display_name,
        shortAddress: parts.length > 0 ? `Near ${parts.slice(0, 2).join(', ')}` : data.display_name,
        address: addr,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      }
    });
  } catch (err) {
    return fail(res, 500, 'Geocoding failed', { error: err.message });
  }
});

/**
 * GET /api/maps/search?q=city+mall+hyderabad
 * Returns matching locations
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return fail(res, 400, 'Search query (q) is required');

    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1&countrycodes=in`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UrbanRide/1.0' }
    });
    const data = await response.json();

    const results = data.map(item => ({
      displayName: item.display_name,
      shortName: [item.address?.road, item.address?.suburb, item.address?.city].filter(Boolean).slice(0, 2).join(', ') || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      category: item.class
    }));

    return ok(res, {
      message: `${results.length} results found`,
      data: { results }
    });
  } catch (err) {
    return fail(res, 500, 'Search failed', { error: err.message });
  }
});

/**
 * GET /api/maps/route?srcLat=17.44&srcLng=78.38&dstLat=17.45&dstLng=78.50
 * Returns route between two points using OSRM (free)
 */
router.get('/route', async (req, res) => {
  try {
    const { srcLat, srcLng, dstLat, dstLng } = req.query;
    if (!srcLat || !srcLng || !dstLat || !dstLng) {
      return fail(res, 400, 'srcLat, srcLng, dstLat, dstLng are required');
    }

    const url = `${OSRM_BASE}/route/v1/driving/${srcLng},${srcLat};${dstLng},${dstLat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      return fail(res, 404, 'No route found');
    }

    const route = data.routes[0];
    const steps = route.legs[0]?.steps?.map(step => ({
      instruction: step.maneuver?.type === 'depart' ? 'Start driving'
        : step.maneuver?.type === 'arrive' ? 'You have arrived'
        : `${step.maneuver?.modifier || ''} ${step.maneuver?.type || ''}`.trim(),
      distance: Math.round(step.distance),
      duration: Math.round(step.duration / 60),
      name: step.name || 'Road'
    })) || [];

    return ok(res, {
      message: 'Route found',
      data: {
        distanceMeters: Math.round(route.distance),
        distanceKm: +(route.distance / 1000).toFixed(1),
        durationSeconds: Math.round(route.duration),
        durationMinutes: Math.round(route.duration / 60),
        geometry: route.geometry,
        steps
      }
    });
  } catch (err) {
    return fail(res, 500, 'Routing failed', { error: err.message });
  }
});

module.exports = router;
