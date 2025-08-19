// api/log_meal.js
/**
 * ✅ Log Meal
 * - Reads user_id from JWT (secureRoute)
 *   - notes (optional)
 */
'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

/**
 * ✅ Log Meal API
 * - Body: { date?, meal_description*, syns*, calories?, healthy_extra_a_used?, healthy_extra_b_used?, notes? }
 * - Saves to meal_logs; returns inserted row
 */
router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const {
      date,
      meal_description,
      syns,
      calories,
      healthy_extra_a_used,
      healthy_extra_b_used,
      notes
    } = req.body || {};

    if (!meal_description || typeof meal_description !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid meal_description.' });
    }
    if (syns == null || isNaN(Number(syns))) {
      return res.status(400).json({ error: 'Missing or invalid syns.' });
    }

    const mealDate = normalizeDate(date) || new Date().toISOString().slice(0, 10);

    const entry = {
      user_id,
      date: mealDate,
      meal_description,
      syns: Number(syns),
      calories: calories != null && !isNaN(Number(calories)) ? Number(calories) : null,
      healthy_extra_a_used: !!healthy_extra_a_used,
      healthy_extra_b_used: !!healthy_extra_b_used,
      notes: notes ?? null
    };

    const { data, error } = await supabase.from('meal_logs').insert([entry]).select();
    if (error) {
      console.error('[log_meal] supabase error:', error.message);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.json({ message: '✅ Meal logged successfully', data });
  } catch (err) {
    console.error('log_meal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
