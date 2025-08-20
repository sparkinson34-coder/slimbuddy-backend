/** /api/connect.js/**
 * ✅ Connect API
 * POST /api/connect/issue  → returns a short Connect Key for the signed-in user
 */
const express = require('express');
const router = express.Router();
const secureRoute = require('../lib/authMiddleware');
const supabase = require('../lib/supabaseClient');

// Simple key generator: SB-XXXX-XXX-X-XXXX
function genKey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chunk = (n) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `SB-${chunk(4)}-${chunk(3)}-${chunk(1)}-${chunk(4)}`;
}

router.post('/issue', secureRoute, async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;

    // Revoke previous keys for this user (optional but tidy)
    const { error: revokeErr } = await supabase
      .from('connect_keys')
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('revoked', false);

    if (revokeErr) {
      console.error('Revoke previous keys error:', revokeErr);
      // Continue anyway
    }

    const connectKey = genKey();
    const expiresAt = null; // or new Date(Date.now() + 90*24*3600e3).toISOString()

    const { error: insErr } = await supabase
      .from('connect_keys')
      .insert([{ user_id: userId, key: connectKey, expires_at: expiresAt }]);

    if (insErr) {
      console.error('Insert key error:', insErr);
      return res.status(500).json({ error: 'Could not issue key' });
    }

    return res.json({ connect_key: connectKey });
  } catch (err) {
    console.error('connect/issue error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;