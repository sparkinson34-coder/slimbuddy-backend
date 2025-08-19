// api/log_exercise.js
/**
 * ✅ Exercise Logging API
 * - Uses names that match the DB exactly:
 *   activity, duration_minutes, intensity, calories_burned, steps, distance_km, date, notes
 * - Reads user_id from the JWT (secureRoute)
 * - If date is not provided, defaults to today (YYYY-MM-DD)
 * - Returns the inserted record for confirmation
 */
'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

/** ✅ Log exercise */
const num = v => { const n=Number(v); return Number.isFinite(n)?n:null; };

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id; if (!user_id) return res.status(401).json({ error:'Unauthorized' });
    const { date, activity, duration_minutes, intensity, calories_burned, steps, distance_km, notes } = req.body || {};
    if (!activity) return res.status(400).json({ error:'Missing activity' });

    const d = normalizeDate(date) || new Date().toISOString().slice(0,10);
    const payload = {
      user_id, date:d, activity,
      duration_minutes: num(duration_minutes),
      intensity: intensity ?? null,
      calories_burned: num(calories_burned),
      steps: num(steps),
      distance_km: num(distance_km),
      notes: notes ?? null
    };
    const { data, error } = await supabase.from('exercise_logs').insert([payload]).select();
    if (error) { console.error('[log_exercise] DB:', error.message); return res.status(500).json({ error:'Database error' }); }

    res.json({ message:'✅ Exercise logged successfully', data });
  } catch (err) { console.error('log_exercise exception:', err); res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
