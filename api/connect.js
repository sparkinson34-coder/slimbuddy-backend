/**
/**
 * 🔐 /api/connect — Issue short-lived Connect Keys for GPT
 *
 * Flow:
 * - Called by your Netlify login page with *Bearer JWT* from Supabase session.
 * - Issues a short, human-friendly connect key (e.g., SB-AB12-3CD-E-4567).
 * - Stores the plaintext key in connect_keys.key (for simplicity + alignment with current middleware),
 *   marks previous keys inactive, and sets an expiry.
 * - GPT users paste this short key once; GPT then sends it in header: X-Connect-Key.
 *
 * Env:
 * - CONNECT_KEY_TTL_DAYS (optional, default 30)
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const supabase = require('../lib/supabaseClient');           // NOTE: path matches your /lib layout
const secureRoute = require('../lib/authMiddleware');        // same auth middleware used elsewhere

const DEFAULT_TTL_DAYS = Number(process.env.CONNECT_KEY_TTL_DAYS || 30);

/**
 * This route expects a valid Supabase access token (Bearer <JWT>) from
 * the magic-link sign-in. The authMiddleware must accept Bearer JWTs,
 * call supabase.auth.getUser(), and set req.user = { id, email }.
 *
 * It then:
 * - Revokes any existing active keys for this user
 * - Generates a short Connect Key (SB-XXXX-XXX-X-XXXX)
 * - Hashes it and stores (user_id, key_hash, expires_at, active=true)
 * - Returns the plain Connect Key for the user to paste in GPT
 */

// helper: generate short printable key
function makeConnectKey() {
  // 12 random bytes ~ 16 chars base32-like, we'll format as SB-XXXX-XXX-X-XXXX
  const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
  // build something friendly: 4-3-1-4 from the raw hex
  return `SB-${raw.slice(0,4)}-${raw.slice(4,7)}-${raw.slice(7,8)}-${raw.slice(8,12)}`;
}

// helper: sha256
function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

router.post('/issue', secureRoute, async (req, res) => {
  try {
    // must be set by authMiddleware when a valid Supabase Bearer token is provided
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized (no user in request)' });
    }
    const userId = req.user.id;

    // Basic inputs (optional label, ttl minutes)
    const { label, ttl_minutes } = req.body || {};
    const ttl = Number.isFinite(+ttl_minutes) && +ttl_minutes > 0 ? +ttl_minutes : 30;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    // Revoke any existing active keys for this user
    const revoke = await supabase
      .from('connect_keys')
      .update({ active: false /*, revoked: true*/ })
      .eq('user_id', userId)
      .eq('active', true);

    if (revoke.error && revoke.error.code !== 'PGRST204') {
      // PGRST204 = no rows, not an error for us
      console.error('Revoke previous keys error:', revoke.error);
      // continue
    }

    // Generate new key
    const plainKey = makeConnectKey();
    const keyHash = sha256(plainKey);

    // Insert new key
    const insert = await supabase
      .from('connect_keys')
      .insert({
        user_id: userId,
        key_hash: keyHash,
        expires_at: expiresAt,
        label: label || null,
        active: true
      })
      .select('id')
      .single();

    if (insert.error) {
      console.error('Insert key error:', insert.error);
      return res.status(500).json({ error: 'Failed to create connect key' });
    }

    return res.json({
      key: plainKey,
      expires_at: expiresAt,
      ttl_minutes: ttl
    });
  } catch (err) {
    console.error('Unhandled /api/connect/issue error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
