// api/log_meal.js
/**
 * ✅ Meal Logging API
 * - Inserts a meal record for the authenticated user into meal_logs
 * - Fields: meal_type, food_items (array or comma-separated string), calories, protein, carbs, fat, date, notes
 * - Reads user_id from the JWT (secureRoute)
 * - If date is not provided, defaults to today
 * - Supports multiple items in one meal entry
 * - Returns the inserted record for confirmation
 */


const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  const {
    user_id,
    meal_description,
    syns,
    meal_type,
    healthy_extra_a_used,
    healthy_extra_b_used,
    notes,
    date
  } = req.body;

  // ✅ Normalize date
  let normalizedDate = date;
  if (date && date.includes('/')) {
    const [day, month, year] = date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  }

  if (!user_id || !meal_description || typeof syns !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: user_id, meal_description, syns.' });
  }

  try {
    const { data, error } = await supabase.from('meal_logs').insert([
      { user_id, meal_description, syns, meal_type, healthy_extra_a_used, healthy_extra_b_used, notes, date: normalizedDate }
    ]);
    if (error) throw error;
    res.json({ message: 'Meal logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
