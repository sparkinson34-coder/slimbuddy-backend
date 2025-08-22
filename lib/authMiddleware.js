/**
 * 🔒 Auth Middleware — Connect-Key first
 * - GPT/Actions send:  X-Connect-Key: SB-XXXX-XXX-X-XXXX  (apiKey style)
 * - Optional: Bearer JWT is still accepted so your Netlify page can
 *   call /api/connect/issue to mint a connect key from the Supabase session.
 */

// lib/authMiddleware.js
const crypto = require('crypto');
const supabase = require('./supabaseClient');

// hash helper
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

// very loose SB key shape: SB-xxxx-xxx-x-xxxx (A/Z/0-9)
const SB_REGEX = /^SB-[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z0-9]-[A-Z0-9]{4}$/i;

module.exports = async function secureRoute(req, res, next) {
  try {
    // 1) Prefer short connect key if supplied
    const connectKey = req.get('X-Connect-Key') || req.get('x-connect-key');
    if (connectKey) {
      if (!SB_REGEX.test(connectKey)) {
        return res.status(401).json({ error: 'Invalid connect key format' });
      }
      const keyHash = sha256(connectKey.toUpperCase());
      const { data, error } = await supabase
        .from('connect_keys')
        .select('user_id, expires_at, active, revoked')
        .eq('key_hash', keyHash)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return res.status(401).json({ error: 'Connect key not found' });
      }
      if (!data.active || data.revoked || new Date(data.expires_at) <= new Date()) {
        return res.status(401).json({ error: 'Connect key expired or inactive' });
      }
      req.user = { id: data.user_id };
      req.authVia = 'connect_key';
      return next();
    }

    // 2) Fallback: JWT in Authorization: Bearer <token>
    const auth = req.get('Authorization') || req.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing credentials (connect key or JWT)' });
    }
    const token = auth.slice(7).trim();

    // Ask Supabase to verify and give us the user
    const { data: uData, error: uErr } = await supabase.auth.getUser(token);
    if (uErr || !uData?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized (bad JWT)' });
    }
    req.user = { id: uData.user.id };
    req.authVia = 'jwt';
    return next();
  } catch (e) {
    console.error('authMiddleware error:', e);
    return res.status(500).json({ error: 'Auth middleware failure' });
  }
};
