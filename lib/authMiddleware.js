/**
 * 🔒 Auth Middleware — Connect-Key first
 * - GPT/Actions send:  X-Connect-Key: SB-XXXX-XXX-X-XXXX  (apiKey style)
 * - Optional: Bearer JWT is still accepted so your Netlify page can
 *   call /api/connect/issue to mint a connect key from the Supabase session.
 */

const supabase = require('./supabaseClient');
const jwt = require('jsonwebtoken');

async function resolveConnectKey(key) {
  if (!key) return null;
  const { data, error } = await supabase
    .from('connect_keys')
    .select('user_id, active, expires_at')
    .eq('key', key)
    .maybeSingle();

  if (error || !data) return null;
  const expired = data.expires_at && new Date(data.expires_at) < new Date();
  if (data.active === false || expired) return null;
  return { id: data.user_id };
}

function looksLikeJwt(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

module.exports = async function secureRoute(req, res, next) {
  try {
    // 1) Preferred: X-Connect-Key
    const ck = req.headers['x-connect-key'] || req.headers['X-Connect-Key'];
    if (ck) {
      const who = await resolveConnectKey(ck);
      if (who && who.id) { req.user = who; return next(); }
      return res.status(401).json({ error: 'Unauthorized (bad connect key)' });
    }

    // 2) Optional: Bearer (used by Netlify page to issue keys)
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth && String(auth).toLowerCase().startsWith('bearer ')) {
      const token = auth.split(' ')[1];
      if (!looksLikeJwt(token)) {
        return res.status(401).json({ error: 'Unauthorized (malformed token)' });
      }
      const decoded = jwt.decode(token);
      if (!decoded?.sub) return res.status(401).json({ error: 'Unauthorized (invalid JWT)' });
      req.user = { id: decoded.sub, email: decoded.email || decoded.user_metadata?.email };
      return next();
    }

    // 3) No credentials
    return res.status(401).json({ error: 'Unauthorized (no credentials)' });
  } catch (e) {
    console.error('Auth error:', e);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
