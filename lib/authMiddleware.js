'use strict';

/**
 * ✅ Robust Auth Middleware (JWT tolerant + debug)
 *
 * Accepts Authorization header in messy forms:
 *   - "Bearer <jwt>"
 *   - "<jwt>"
 *   - "my token is <jwt> thanks"
 *
 * Extracts the first JWT-looking token, verifies it with Supabase,
 * and attaches req.user = { id, email? }.
 * Never calls next() unless req.user is set.
 * Emits extra details only when "X-Debug: true" is present.
 */

const supabase = require('./supabaseClient');
const JWT_REGEX = /([A-Za-z0-9\-_]+)\.([A-Za-z0-9\-_]+)\.([A-Za-z0-9\-_]+)/;

async function secureRoute(req, res, next) {
  const debug = req.headers['x-debug'] === 'true';
  try {
    const raw = req.headers.authorization || '';
    if (!raw) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    // Normalize header → token candidate
    let candidate = raw.replace(/^Bearer\s+/i, '').trim();
    const match = candidate.match(JWT_REGEX);
    if (!match) {
      return res.status(401).json({
        error: 'Invalid token format',
        ...(debug ? { debug: { received: raw } } : {})
      });
    }

    const token = match[0];
    // Keep header consistent downstream (and for any logging)
    req.headers.authorization = `Bearer ${token}`;

    // Verify with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        ...(debug ? { debug: { supabaseError: error?.message || null } } : {})
      });
    }

    const u = data.user;
    req.user = { id: u.id, email: u.email || u.user_metadata?.email || null };

    // Safety: never proceed without req.user.id
    if (!req.user.id) {
      return res.status(401).json({
        error: 'Authenticated but no user id found',
        ...(debug ? { debug: { rawAuth: raw } } : {})
      });
    }

    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      ...(debug ? { debug: { message: err.message } } : {})
    });
  }
}

module.exports = secureRoute;

