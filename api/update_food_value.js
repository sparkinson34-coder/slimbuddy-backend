// update_food_value.js
/**
 * ✅ Update Food Syn Value API
 * - Inserts or updates a Syn value for a food for the authenticated user
 * - Fields: food_name (string), syns (number), date (optional, defaults to today), notes (optional)
 * - Reads user_id from JWT (secureRoute)
 * - Uses upsert to prevent duplicates for the same food_name+date+user_id
 */
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { food_name, syns, date, notes } = req.body;

    if (!food_name || typeof food_name !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid food_name.' });
    }
    if (syns == null || isNaN(Number(syns))) {
      return res.status(400).json({ error: 'Missing or invalid syns value.' });
    }

    const d = normalizeDate(date) || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('syn_values')
      .upsert([{ user_id, food_name, syn_value: Number(syns), date: d, notes: notes || null }])
      .select();

    if (error) throw error;
    return res.json({ message: '✅ Syn value logged successfully', data });
  } catch (err) {
    console.error('update_food_value error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
