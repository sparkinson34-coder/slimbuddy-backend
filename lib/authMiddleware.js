// authMiddleware.js
'use strict';

/**
 * ✅ Auth Middleware
 * - Reads JWT from Authorization header: "Bearer <token>"
 * - Decodes (not verifies) and attaches user id to req.user.id
 * - Never references `req` at top-level (only inside the middleware)
 */
const jwt = require('jsonwebtoken');

function secureRoute(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.decode(token); // decoding only; Supabase verifies token upstream
    const userId = decoded?.sub || decoded?.user?.id || decoded?.user_id;
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    req.user = { id: userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = secureRoute;
