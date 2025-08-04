/**
 * ✅ Auth Middleware
 * Verifies JWT from Authorization header and extracts Supabase user_id
 */
const jwt = require('jsonwebtoken');

async function secureRoute(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.decode(token);
    if (!decoded.sub) throw new Error('Invalid token');
    req.user = { id: decoded.sub }; // ✅ Supabase auth.users ID
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = secureRoute;