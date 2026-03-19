/**
 * Optional auth middleware.
 * If a valid JWT is present, attaches req.user. Otherwise continues without auth.
 * Use for endpoints that work for both guests and logged-in users.
 */

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next(); // no token = guest, continue without user

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Invalid token — still allow the request, just without user
  }

  next();
};
