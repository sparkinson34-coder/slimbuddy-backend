require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ GET /api/user_profile
router.get('/', async (req, res) => {
  console.log('Incoming request to /api/user_profile');

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1]; // ✅ Extract JWT token
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    // ✅ Validate token and get user info
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error || !user?.user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // ✅ Return clean response
    return res.json({ user_id: user.user.id });

  } catch (err) {
    console.error('Error in /user_profile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
