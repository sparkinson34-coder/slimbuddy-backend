/**
 * ✅ Connect Key Issuer
 * Creates a short-lived “connect key” tied to the Supabase user.
 * - Auth: Authorization: Bearer <Supabase access_token>  (from magic link)
 * - DB: stores only a SHA-256 hash of the key (no plaintext)
 * - Revoke any previous active keys for this user
 * - Sets expires_at (default: now + 30 minutes)
 */
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

function randomKey() {
  // SB-XXXX-XXX-X-XXXX  (keeps it short & human-friendly)
  const rand = () => crypto.randomBytes(2).toString('hex').slice(0, 4).toUpperCase();
  const chunk1 = rand();           // 4
  const chunk2 = rand().slice(0,3); // 3
  const chunk3 = rand().slice(0,1); // 1
  const chunk4 = rand();           // 4
  return `SB-${chunk1}-${chunk2}-${chunk3}-${chunk4}`;
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

// POST /api/connect/issue
router.post('/issue', secureRoute, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized (no user id)' });
    }

    // explicit expiry: 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // revoke any old active keys
    const revoke = await supabase
      .from('connect_keys')
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('revoked', false);

    if (revoke.error) {
      console.error('Revoke previous keys error:', revoke.error);
      // don’t return; continue to issue a new key anyway
    }

    // make a new key & store only its hash
    const key = randomKey();
    const keyHash = sha256Hex(key);

    const insert = await supabase
      .from('connect_keys')
      .insert({
        user_id: userId,
        key_hash: keyHash,
        expires_at: expiresAt,
        revoked: false,
        last_used_at: null
      })
      .select('id')
      .single();

    if (insert.error) {
      console.error('Insert key error:', insert.error);
      return res.status(500).json({ error: 'failed_to_create_key' });
    }

    return res.json({
      ok: true,
      connect_key: key,
      expires_at: expiresAt
    });
  } catch (err) {
    console.error('Issue key unexpected error:', err);
    return res.status(500).json({ error: 'unexpected_error' });
  }
});

module.exports = router;