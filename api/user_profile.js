const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');

router.get('/', async (req, res) => {
  try {
    console.log('Incoming request to /api/user_profile');

    // ✅ Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1]; // Extract token
    console.log('Extracted Token:', token);
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // ✅ Get user from token
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.error('Supabase getUser error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('Fetched User Profile:', data.user);
    return res.json({ user: data.user });

  } catch (err) {
    console.error('Error in /api/user_profile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
