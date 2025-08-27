/**
 * ✅ Connect Key: verify endpoint
 * Path: /api/connect/verify
 *
 * Purpose:
 *   Validates an X-Connect-Key for the currently-authenticated user.
 *   Returns 200 + { ok:true, user_id } when the key is valid and belongs to the user.
 *
 * Accepts key from either:
 *   - Header: X-Connect-Key: SB-XXXX-XXX-X-XXXX
 *   - OR Authorization: Connect SB-XXXX-XXX-X-XXXX
 *
 * DB table expected (public.connect_keys):
 *   id (uuid) PK
 *   user_id (uuid) FK -> auth.users.id
 *   key_hash (text) NOT NULL  // sha256 of raw key
 *   created_at (timestamptz) default now()
 *   expires_at (timestamptz) NOT NULL
 *   active (boolean) default true
 *   label (text) NULL
 */

const express = require('express');
const crypto = require('crypto');

// NOTE: this file lives in /api/connect/, so we go up TWO levels to /lib
const secureRoute = require('../../lib/authMiddleware');
const supabase = require('../../lib/supabaseClient');

const router = express.Router();

// Helper: pull key from headers, support two formats
function extractRawKey(req) {
  const h = req.headers || {};
  const xKey = h['x-connect-key'] || h['X-Connect-Key'];
  if (xKey && typeof xKey === 'string') return xKey.trim();

  const auth = h.authorization || h.Authorization || '';
  // support: "Connect SB-...."
  if (auth.toLowerCase().startsWith('connect ')) {
    return auth.slice('connect '.length).trim();
  }
  return null;
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

// GET /api/connect/verify  (simple health)
router.get('/', (_req, res) => {
  return res.json({ ok: true, route: '/api/connect/verify' });
});

// POST /api/connect/verify  (secure)
router.post('/', secureRoute, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized (no user in request)' });
    }
    const userId = req.user.id;

    const rawKey = extractRawKey(req);
    if (!rawKey) {
      return res.status(400).json({ error: 'Missing X-Connect-Key (or Authorization: Connect ...)' });
    }

    // Basic format sanity (SB-...-...-...-....), not strictly required, but nice to have:
    if (!/^SB-[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z]-[A-Z0-9]{4}$/i.test(rawKey)) {
      return res.status(400).json({ error: 'Invalid Connect Key format' });
    }

    const keyHash = sha256Hex(rawKey);
    const nowIso = new Date().toISOString();

    // Look up the key for this user, must be active and not expired
    const { data, error } = await supabase
      .from('connect_keys')
      .select('id, user_id, expires_at, active, label')
      .eq('user_id', userId)
      .eq('key_hash', keyHash)
      .eq('active', true)
      .gt('expires_at', nowIso)
      .maybeSingle();

    if (error) {
      console.error('verify: supabase error', error);
      return res.status(500).json({ error: 'Verification query failed' });
    }

    if (!data) {
      return res.status(401).json({ error: 'Invalid or expired Connect Key' });
    }

    return res.json({
      ok: true,
      user_id: data.user_id,
      expires_at: data.expires_at,
      label: data.label || null,
    });
  } catch (err) {
    console.error('verify: unexpected error', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
