/**
 * Standardised API response helpers.
 *
 * Every response follows:
 * {
 *   success: true | false,
 *   type?: "shared" | "solo" | "walking" | ...,
 *   message: "...",
 *   data: { ... }
 * }
 */

function ok(res, { type, message, data } = {}) {
  return res.status(200).json({
    success: true,
    type: type || undefined,
    message: message || 'OK',
    data: data || {}
  });
}

function created(res, { type, message, data } = {}) {
  return res.status(201).json({
    success: true,
    type: type || undefined,
    message: message || 'Created',
    data: data || {}
  });
}

function fail(res, statusCode, message, extra = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...extra
  });
}

module.exports = { ok, created, fail };
