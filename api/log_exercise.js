// api/log_exercise.js
/**
 * ✅ Exercise Logging API
 * - Uses names that match the DB exactly:
 *   activity, duration_minutes, intensity, calories_burned, steps, distance_km, date, notes
 * - Reads user_id from the JWT (secureRoute)
 * - If date is not provided, defaults to today
 * - Returns the inserted record for confirmation
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

// Normalize DD/MM/YYYY or DD-MM-YYYY → YYYY-MM-DD
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).replace(/\//g, '-');
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr; // assume already ISO
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id || req.user?.sub;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const {
      date,
      activity,
      duration_minutes,
      intensity,
      calories_burned,
      steps,
      distance_km,
      notes
    } = req.body || {};

    if (!date) return res.status(400).json({ error: 'Missing required field: date' });
    if (!activity) return res.status(400).json({ error: 'Missing required field: activity' });

    const payload = {
      user_id,
      date: normalizeDate(date),
      activity,
      duration_minutes: duration_minutes != null ? Number(duration_minutes) : null,
      intensity: intensity || null,
      calories_burned: calories_burned != null ? Number(calories_burned) : null,
      steps: steps != null ? parseInt(steps, 10) : null,
      distance_km: distance_km != null ? Number(distance_km) : null,
      notes: notes || null
    };

    const { data, error } = await supabase.from('exercise_logs').insert([payload]).select();
    if (error) throw error;

    return res.json({ message: '✅ Exercise logged successfully', data });
  } catch (err) {
    console.error('❌ log_exercise error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
