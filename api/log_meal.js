// api/log_meal.js
/**
 * ✅ Meal Logging API
 * - Uses JWT user_id (req.user.id)
 * - Requires: meal_description (string), syns (number)
 * - Optional: meal_type, healthy_extra_a_used, healthy_extra_b_used, calories, notes, date
 * - Normalizes date: DD/MM/YYYY or DD-MM-YYYY → YYYY-MM-DD (ISO)
 * - Inserts into public.meal_logs and returns the inserted row
 */
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      meal_description,
      syns,
      meal_type,
      healthy_extra_a_used,
      healthy_extra_b_used,
      calories,
      notes,
      date
    } = req.body;

    if (!meal_description || typeof meal_description !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid meal_description.' });
    }
    if (syns == null || isNaN(Number(syns))) {
      return res.status(400).json({ error: 'Missing or invalid syns.' });
    }

    const d = normalizeDate(date) || new Date().toISOString().slice(0, 10);

    const payload = {
      user_id,
      date: d,
      meal_type: meal_type || null,
      meal_description,
      syns: Number(syns),
      healthy_extra_a_used: !!healthy_extra_a_used,
      healthy_extra_b_used: !!healthy_extra_b_used,
      calories: calories == null ? null : Number(calories),
      notes: notes || null
    };

    const { data, error } = await supabase.from('meal_logs').insert([payload]).select();
    if (error) throw error;

    return res.json({ message: '✅ Meal logged successfully', data });
  } catch (err) {
    console.error('log_meal error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
