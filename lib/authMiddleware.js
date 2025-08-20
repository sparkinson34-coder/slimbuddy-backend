/** /api/connect_issue.js
 * ✅ Issue a short, opaque Connect Key for GPT Actions
 * POST /api/connect/issue
 * Headers:
 *   Authorization: Bearer <Supabase JWT>   (from Netlify login page)
 * Body: none
 * Response: { connect_key: "SB-XXXX-XXXX-XXXX", expires_at: "2025-09-20T..." }
 */
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const supabase = require('../lib/supabaseClient');

// Simple formatter e.g. "SB-4JZK-2MX7-G6QH"
function makeKey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = (n) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `SB-${pick(4)}-${pick(4)}-${pick(4)}`;
}

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

router.post('/', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    // Validate Supabase JWT & get user
    const token = auth.split(' ')[1];
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user?.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = userRes.user.id;

    const connectKey = makeKey();
    const keyHash = sha256(connectKey);
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

    // Insert hashed key
    const { error: insErr } = await supabase
      .from('connect_keys')
      .insert({ user_id: userId, key_hash: keyHash, expires_at: expiresAt, active: true });
    if (insErr) {
      return res.status(500).json({ error: 'Failed to store connect key' });
    }

    return res.json({ connect_key: connectKey, expires_at: expiresAt });
  } catch (e) {
    console.error('connect_issue error:', e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
