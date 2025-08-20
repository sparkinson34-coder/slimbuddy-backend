// /api/connect.js
/**
 * ✅ Issue short-lived "Connect Key" for GPT
 * - Requires Authorization: Bearer <Supabase access_token>
 * - Revokes any previous active key for the user
 * - Returns plaintext connect_key; stores only a hash in DB
 */
const express = require('express');
const crypto = require('crypto');

const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

const router = express.Router();

function generateKey() {
  // SB-XXXX-XXX-X-XXXX (alphanumeric uppercase)
  const rnd = (n) => crypto.randomBytes(n).toString('hex').toUpperCase();
  // shorten hex to desired groups
  return `SB-${rnd(2).slice(0,4)}-${rnd(2).slice(0,3)}-${rnd(1).slice(0,1)}-${rnd(2).slice(0,4)}`;
}

function hashKey(rawKey) {
  const pepper = process.env.CONNECT_KEY_PEPPER || '';
  return crypto.createHash('sha256').update(`${rawKey}:${pepper}`).digest('hex');
}

router.post('/issue', secureRoute, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized (no user)' });
    }

    // 1) revoke previous active keys
    const { error: revokeErr } = await supabase
      .from('connect_keys')
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('revoked', false);

    if (revokeErr) {
      console.error('Revoke previous keys error:', revokeErr);
      // non-fatal, carry on
    }

    // 2) insert new key (hash only)
    const plain = generateKey();
    const keyHash = hashKey(plain);

    let expiresAt = null;
    const ttlDays = parseInt(process.env.CONNECT_KEY_TTL_DAYS || '0', 10);
    if (ttlDays > 0) {
      const dt = new Date();
      dt.setUTCDate(dt.getUTCDate() + ttlDays);
      expiresAt = dt.toISOString();
    }

    const { data, error: insErr } = await supabase
      .from('connect_keys')
      .insert({
        user_id: userId,
        key_hash: keyHash,
        expires_at: expiresAt,
        revoked: false,
      })
      .select()
      .single();

    if (insErr) {
      console.error('Insert key error:', insErr);
      return res.status(500).json({ error: 'Failed to create key' });
    }

    return res.json({ connect_key: plain, id: data.id, expires_at: expiresAt });
  } catch (err) {
    console.error('Issue key fatal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
