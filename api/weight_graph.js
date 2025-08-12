// api/weight_graph.js
/**
 * ✅ Weight Graph API
 * - Retrieves the weight log history for the authenticated user
 * - Returns data points for graphing user weight over time
 * - Accepts optional query parameters (e.g., date range)
 * - Reads user_id from the JWT (secureRoute)
 */

require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/weight_graph?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    // Validate token
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    const user_id = user.user.id;
    const { start, end } = req.query;

    let query = supabase
      .from('weight_logs')
      .select('date, weight')
      .eq('user_id', user_id)
      .order('date', { ascending: true });

    if (start) query = query.gte('date', start);
    if (end) query = query.lte('date', end);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ user_id, data });
  } catch (err) {
    console.error('Error in /weight_graph:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
