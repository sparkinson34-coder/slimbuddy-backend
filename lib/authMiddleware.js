// authMiddleware.js
/**
 * 
 * ✅ Auth Middleware
 * - Extracts Bearer JWT from Authorization header
 * - Decodes Supabase JWT to get the user_id (auth.users.id)
 * - Attaches { id: user_id } to req.user
 * - Rejects request with 401 if missing or invalid
 */
const jwt = require('jsonwebtoken');

// Temporary debug log to see if token is arriving in the backend. 
console.log("AUTH HEADER:", req.headers['authorization']);

async function secureRoute(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.decode(token);
    if (!decoded?.sub) {
      throw new Error('Invalid token');
    }
    req.user = { id: decoded.sub }; // ✅ Supabase auth.users ID
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = secureRoute;
