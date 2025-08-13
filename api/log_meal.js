// api/log_meal.js
/**
 * ✅ Log Meal API
 * - Reads user_id from JWT (secureRoute)
 * - Fields:
 *   - date (optional; defaults to today; accepts DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)
 *   - meal_description (required, string)
 *   - syns (required, number)
 *   - calories (optional, number — only if column exists in table)
 *   - notes (optional)
 * - Inserts into meal_logs and returns the inserted row
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { date, meal_description, syns, calories, notes } = req.body;

    // Validate required fields
    if (!meal_description || typeof meal_description !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid meal_description.' });
    }
    if (syns == null || isNaN(Number(syns))) {
      return res.status(400).json({ error: 'Missing or invalid syns.' });
    }

    // Date normalization
    const mealDate = date ? normalizeDate(date) : new Date().toISOString().split('T')[0];
    if (!mealDate) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY.' });
    }

    // Build insert object
    const mealEntry = {
      user_id,
      date: mealDate,
      meal_description,
      syns: Number(syns),
      notes: notes || null
    };

    // Add calories only if provided and valid
    if (calories != null && !isNaN(Number(calories))) {
      mealEntry.calories = Number(calories);
    }

    const { data, error } = await supabase
      .from('meal_logs')
      .insert([mealEntry])
      .select();

    if (error) throw error;

    return res.json({ message: '✅ Meal logged successfully', data });
  } catch (err) {
    console.error('log_meal error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
