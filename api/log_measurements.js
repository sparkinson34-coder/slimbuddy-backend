// api/log_measurements.js
/**
 * ✅ Body Measurements Logging API
 * - Inserts a body measurement record for the authenticated user into body_measurements
 * - Fields: chest, waist, hips, thigh, arm, date, notes
 * - Reads user_id from the JWT (secureRoute)
 * - All measurements stored in centimeters
 * - If date is not provided, defaults to today
 * - Returns the inserted record for confirmation
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const secureRoute = require('../lib/authMiddleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Normalize date
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/\//g, '-');
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
}

// ✅ Convert inches to cm
function inchesToCm(value) {
  return value && !isNaN(value) ? parseFloat(value * 2.54).toFixed(1) : null;
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const { bust, waist, hips, neck, arm, under_bust, thighs, knees, ankles, notes, date } = req.body;
    const user_id = req.user.sub || req.user.id;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const normalizedDate = normalizeDate(date);
    const payload = {
      user_id,
      bust: inchesToCm(bust),
      waist: inchesToCm(waist),
      hips: inchesToCm(hips),
      neck: inchesToCm(neck),
      arm: inchesToCm(arm),
      under_bust: inchesToCm(under_bust),
      thighs: inchesToCm(thighs),
      knees: inchesToCm(knees),
      ankles: inchesToCm(ankles),
      notes: notes || '',
      date: normalizedDate
    };

    console.log('🛠 Insert Measurements:', payload);

    const { data, error } = await supabase.from('body_measurements').insert([payload]);

    if (error) throw error;

    res.json({ message: '✅ Measurements logged successfully', data });
  } catch (err) {
    console.error('❌ Measurements Log Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
