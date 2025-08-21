/**
 * /lib/authMiddleware.js
 * ✅ Auth Middleware (JWT or Connect Key)
 *
 * What it accepts:
 *  1) Authorization: Bearer <Supabase access_token JWT>
 *     - We decode the JWT locally and read `sub` → req.user.id
 *  2) X-Connect-Key: SB-XXXX-XXX-X-XXXX (short key from /api/connect/issue)
 *     - We SHA-256 hash the key, look up in public.connect_keys (revoked=false, not expired),
 *       then set req.user.id to the owning user_id and update last_used_at.
 *
 * Notes:
 *  - This middleware is mounted per-route: router.post('/', secureRoute, ...)
 *  - Make sure you have an index on connect_keys(key_hash) and the schema includes:
 *      columns: id, user_id, key_hash (NOT NULL), created_at, expires_at (NOT NULL),
 *               revoked (boolean NOT NULL), last_used_at (timestamptz)
 *      partial unique index: user_id where revoked=false (optional but recommended)
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

// --- Helpers ---------------------------------------------------------------

// Extract a JWT-like token from arbitrary text (e.g., "my token is eyJ...").
function extractJwt(text) {
  if (!text || typeof text !== 'string') return null;
  // Strip common prefixes like "Bearer"
  const cleaned = text.replace(/^Bearer\s+/i, '').trim();
  // Find a JWT-ish pattern anywhere in the string (three base64url segments)
  const match = cleaned.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
  return match ? match[0] : null;
}

// Normalize & validate the short connect key (SB-…).
function extractConnectKey(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/^Key\s+/i, '').replace(/^Bearer\s+/i, '').trim();
  // Very simple format check to avoid hashing junk
  if (/^SB-[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z0-9]{1}-[A-Z0-9]{4}$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  return null;
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

// --- Middleware ------------------------------------------------------------

async function secureRoute(req, res, next) {
  try {
    // 1) Try Authorization: Bearer <JWT>
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const jwtMaybe = extractJwt(authHeader);
    if (jwtMaybe) {
      // We only decode to read `sub`; Supabase issued it, and we trust it inside our perimeter.
      const decoded = jwt.decode(jwtMaybe);
      const sub = decoded && (decoded.sub || decoded.user_id);
      if (sub) {
        req.user = { id: sub, mode: 'jwt' };
        return next();
      }
      // fall through to connect-key path if no sub
    }

    // 2) Try X-Connect-Key: SB-…
    const rawKey =
      req.headers['x-connect-key'] ||
      req.headers['X-Connect-Key'] ||
      req.headers['x_connect_key']; // belt & braces
    const connectKey = extractConnectKey(rawKey);
    if (connectKey) {
      const keyHash = sha256Hex(connectKey);

      // Look up active (not revoked) and not expired key
      const { data, error } = await supabase
        .from('connect_keys')
        .select('user_id, revoked, expires_at')
        .eq('key_hash', keyHash)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        // DB error — don’t leak details
        return res.status(500).json({ error: 'auth_lookup_failed' });
      }

      const row = Array.isArray(data) && data[0];
      if (!row) {
        return res.status(401).json({ error: 'invalid_connect_key' });
      }
      if (row.revoked) {
        return res.status(401).json({ error: 'key_revoked' });
      }
      if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
        return res.status(401).json({ error: 'key_expired' });
      }

      // Mark usage (best-effort; ignore errors)
      await supabase
        .from('connect_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', keyHash);

      req.user = { id: row.user_id, mode: 'connect_key' };
      return next();
    }

    // Neither JWT nor Connect Key provided/valid
    return res.status(401).json({
      error: 'unauthorized',
      hint:
        'Provide a Supabase JWT in Authorization: Bearer <token> or a Connect Key in X-Connect-Key: SB-XXXX-XXX-X-XXXX.',
    });
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'auth_unexpected_error' });
  }
}

module.exports = secureRoute;
