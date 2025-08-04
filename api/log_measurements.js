/**
 * ✅ Measurements Logging API
 * - Accepts measurements in inches and converts to cm
 * - Uses user_id from JWT, NOT the request body
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const secureRoute = require('../lib/authMiddleware');

// ✅ Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Convert inches to cm
function inchesToCm(value) {
  return value && !isNaN(value) ? parseFloat(value * 2.54).toFixed(1) : null;
}

router.post('/', secureRoute, async (req, res) => {
  const { bust, waist, hips, neck, arm, under_bust, thighs, knee, ankles, notes, date } = req.body;
  const user_id = req.user.sub || req.user.id; // ✅ Extracted from JWT payload

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  // ✅ Normalize date (DD/MM/YYYY → YYYY-MM-DD)
  let normalizedDate = date.replace(/\//g, '-').split('-').reverse().join('-');

  try {
    const { data, error } = await supabase.from('measurements').insert([
      {
        user_id,
        bust: inchesToCm(bust),
        waist: inchesToCm(waist),
        hips: inchesToCm(hips),
        neck: inchesToCm(neck),
        arm: inchesToCm(arm),
        under_bust: inchesToCm(under_bust),
        thighs: inchesToCm(thighs),
        knee: inchesToCm(knee),
        ankles: inchesToCm(ankles),
        notes,
        date: normalizedDate,
      },
    ]);

    if (error) throw error;

    res.json({ message: 'Measurements logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
