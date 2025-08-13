// api/log_measurements.js
/**
 * ✅ Body Measurements Logging API
 * - Inserts a body measurement record for the authenticated user into body_measurements
 * - Fields (cm): bust, waist, hips, neck, arm, under_bust, thighs, knees, ankles, date, notes
 * - Reads user_id from the JWT (secureRoute)
 * - If date is not provided, defaults to today (YYYY-MM-DD)
 * - Returns the inserted record for confirmation
 */
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

function cleanNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      date,
      bust, waist, hips, neck, arm, under_bust, thighs, knees, ankles,
      notes
    } = req.body;

    const d = normalizeDate(date) || new Date().toISOString().slice(0, 10);

    const payload = {
      user_id,
      date: d,
      bust: cleanNum(bust),
      waist: cleanNum(waist),
      hips: cleanNum(hips),
      neck: cleanNum(neck),
      arm: cleanNum(arm),
      under_bust: cleanNum(under_bust),
      thighs: cleanNum(thighs),
      knees: cleanNum(knees),
      ankles: cleanNum(ankles),
      notes: notes || null
    };

    const { data, error } = await supabase.from('body_measurements').insert([payload]).select();
    if (error) throw error;

    return res.json({ message: '✅ Measurements logged successfully', data });
  } catch (err) {
    console.error('log_measurements error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
