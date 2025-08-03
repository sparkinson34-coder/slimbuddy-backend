const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');

console.log('Incoming request to /api/user_profile');
console.log('Token:', token);

// ✅ GET user profile using JWT
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token is required' });

    // ✅ Validate token and fetch user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: error?.message || 'Invalid token' });

    res.json({ user_id: user.id });
  } catch (err) {
    console.error('Error in /api/user_profile:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;