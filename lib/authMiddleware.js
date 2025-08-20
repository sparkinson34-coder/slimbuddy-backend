/**
 * /lib/authMiddleware.js
 * ✅ Auth Middleware (JWT or Connect Key)
 * - If Authorization: Bearer <JWT> present: decode and set req.user.id
 * - Else if X-Connect-Key: <key> present: look up user_id in public.connect_keys
 * - Otherwise 401
 */
const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

function isLikelyJwt(s) {
  return typeof s === 'string' && s.split('.').length === 3;
}

async function secureRoute(req, res, next) {
  try {
    // 1) Bearer path
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice(7).trim();
      const decoded = jwt.decode(token);
      if (!decoded?.sub) return res.status(401).json({ error: 'Unauthorized (bad JWT)' });
      req.user = { id: decoded.sub, tokenSource: 'jwt' };
      return next();
    }

    // 2) Connect Key path
    const connectKey = req.headers['x-connect-key'] || req.headers['X-Connect-Key'];
    if (connectKey && typeof connectKey === 'string') {
      // Lookup key -> user_id (must not be revoked/expired)
      const { data, error } = await supabase
        .from('connect_keys')
        .select('user_id, revoked, expires_at')
        .eq('key', connectKey)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('connect_keys lookup error:', error);
        return res.status(500).json({ error: 'Auth lookup failed' });
      }
      if (!data || data.revoked || (data.expires_at && new Date(data.expires_at) < new Date())) {
        return res.status(401).json({ error: 'Invalid or expired connect key' });
      }

      req.user = { id: data.user_id, tokenSource: 'connect_key' };
      return next();
    }

    // If GPT pasted raw token text, try to normalize (best‑effort)
    const raw = (req.headers['x-api-key'] || '').toString().trim();
    if (isLikelyJwt(raw)) {
      const decoded = jwt.decode(raw);
      if (decoded?.sub) {
        req.user = { id: decoded.sub, tokenSource: 'jwt_raw' };
        return next();
      }
    }

    return res.status(401).json({ error: 'Unauthorized (no token)' });
  } catch (err) {
    console.error('secureRoute error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = secureRoute;
