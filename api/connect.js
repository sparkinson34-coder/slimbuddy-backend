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

// api/connect.js
const express = require('express');
const crypto = require('crypto');

const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

const DEFAULT_TTL_MINUTES = Number(process.env.CONNECT_KEY_TTL_MINUTES || 30);

function makeConnectKey() {
  const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `SB-${raw.slice(0,4)}-${raw.slice(4,7)}-${raw.slice(7,8)}-${raw.slice(8,12)}`;
}

function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

router.post('/issue', secureRoute, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized (no user in request)' });
    }
    const userId = req.user.id;

    const { label, ttl_minutes } = req.body || {};
    const ttl = Number.isFinite(+ttl_minutes) && +ttl_minutes > 0 ? +ttl_minutes : DEFAULT_TTL_MINUTES;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    // Revoke any existing active keys
    const revoke = await supabase
      .from('connect_keys')
      .update({ active: false, revoked: true })
      .eq('user_id', userId)
      .eq('active', true);

    if (revoke.error && revoke.error.code !== 'PGRST204') {
      console.error('Revoke previous keys error:', revoke.error);
      // not fatal, continue
    }

    const plainKey = makeConnectKey();
    const keyHash = sha256(plainKey);

    const insert = await supabase
      .from('connect_keys')
      .insert({
        user_id: userId,
        key_hash: keyHash,
        expires_at: expiresAt,
        label: label || null,
        active: true,
        revoked: false
      })
      .select('id')
      .single();

    if (insert.error) {
      console.error('Insert key error:', insert.error);
      return res.status(500).json({ error: 'Failed to create connect key' });
    }

    return res.json({ key: plainKey, expires_at: expiresAt, ttl_minutes: ttl });
  } catch (err) {
    console.error('Unhandled /api/connect/issue error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
