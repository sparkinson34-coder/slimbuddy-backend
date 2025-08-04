/**
 * ✅ Authentication Middleware
 * - Verifies JWT sent in Authorization header
 * - Attaches user object to req.user for use in routes
 */

const jwt = require('jsonwebtoken');

module.exports = function secureRoute(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Bearer token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ✅ user_id now available as req.user.id
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
