// api/log_exercise.js
/**
 * ✅ Exercise Logging API
 * - Uses names that match the DB exactly:
 *   activity, duration_minutes, intensity, calories_burned, steps, distance_km, date, notes
 * - Reads user_id from the JWT (secureRoute)
 * - If date is not provided, defaults to today (YYYY-MM-DD)
 * - Returns the inserted record for confirmation
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
      activity,
      duration_minutes,
      intensity,
      calories_burned,
      steps,
      distance_km,
      date,
      notes
    } = req.body;

    if (!activity || typeof activity !== 'string') {
      return res.status(400).json({ error: 'Missing required field: activity.' });
    }

    const d = normalizeDate(date) || new Date().toISOString().slice(0, 10);

    const payload = {
      user_id,
      activity,
      duration_minutes: Number.isFinite(Number(duration_minutes)) ? Number(duration_minutes) : null,
      intensity: intensity || null,
      calories_burned: Number.isFinite(Number(calories_burned)) ? Number(calories_burned) : null,
      steps: Number.isFinite(Number(steps)) ? Number(steps) : null,
      distance_km: Number.isFinite(Number(distance_km)) ? Number(distance_km) : null,
      date: d,
      notes: notes || null
    };

    const { data, error } = await supabase.from('exercise_logs').insert([payload]).select();
    if (error) throw error;

    return res.json({ message: '✅ Exercise logged successfully', data });
  } catch (err) {
    console.error('log_exercise error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
