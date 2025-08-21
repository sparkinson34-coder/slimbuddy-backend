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
const router = express.Router();

const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

const DEFAULT_TTL_DAYS = Number(process.env.CONNECT_KEY_TTL_DAYS || 30);

// --- helpers ---
function randChunk(len) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // skip ambiguous chars
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
function generateHumanKey() {
  // SB-XXXX-XXX-X-XXXX (easy to read/dictate)
  return `SB-${randChunk(4)}-${randChunk(3)}-${randChunk(1)}-${randChunk(4)}`;
}

// --- POST /api/connect/issue ---
// Requires Bearer JWT (from Netlify login page). DO NOT call this from GPT.
router.post('/issue', secureRoute, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized (no user in request)' });
    }
    const userId = req.user.id;

    // 1) deactivate previous keys for this user
    const { error: revokeErr } = await supabase
      .from('connect_keys')
      .update({ active: false })
      .eq('user_id', userId)
      .eq('active', true);

    if (revokeErr) {
      console.error('Revoke previous keys error:', revokeErr);
      // continue anyway — not fatal
    }

    // 2) mint a new key (plaintext)
    const key = generateHumanKey();
    const expiresAt = new Date(Date.now() + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('connect_keys')
      .insert({
        user_id: userId,
        key,                // plaintext (aligns with current authMiddleware)
        expires_at: expiresAt,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert key error:', error);
      return res.status(500).json({ error: 'Failed to create connect key' });
    }

    return res.json({
      ok: true,
      key,              // return plaintext once so the UI can show it to user
      expires_at: expiresAt,
    });
  } catch (e) {
    console.error('connect/issue error:', e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
