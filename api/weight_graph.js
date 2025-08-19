// api/weight_graph.js
/**
 * ✅ Weight Graph Data API
 * - Fetches weight_logs for the authenticated user between optional start and end dates
 * - Returns weight data sorted by date ascending
 * - Accepts start/end query params; defaults to last 30 days if not provided
 * - Dates run through normalizeDate to allow DD-MM-YYYY input
 */
'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

/**
 * ✅ Weight Graph Data API
 * - Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD  (defaults to last 30 days)
 * - Returns [{date, weight}] sorted asc
 */
router.get('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    let { start, end } = req.query;
    start = normalizeDate(start);
    end = normalizeDate(end);

    const today = new Date();
    if (!end) end = today.toISOString().slice(0, 10);
    if (!start) {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      start = past.toISOString().slice(0, 10);
    }

    const { data, error } = await supabase
      .from('weight_logs')
      .select('date, weight')
      .eq('user_id', user_id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) {
      console.error('[weight_graph] supabase error:', error.message);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.json({ user_id, data: data || [] });
  } catch (err) {
    console.error('weight_graph error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
