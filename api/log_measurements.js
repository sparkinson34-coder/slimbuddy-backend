/**
 * ✅ Measurements Logging API
 * - Accepts measurements in inches and converts them to cm
 * - Uses user_id extracted securely from JWT token
 * - Validates all required inputs
 * - Handles Supabase insertion with proper error handling
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const secureRoute = require('../lib/authMiddleware');

// ✅ Initialize Supabase using Service Role Key for DB insert
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Convert inches to cm helper
function inchesToCm(value) {
  return value && !isNaN(value) ? parseFloat(value * 2.54).toFixed(1) : null;
}

router.post('/', secureRoute, async (req, res) => {
  try {
    // ✅ Extract data from request body
    const {
      bust,
      waist,
      hips,
      neck,
      arm,
      under_bust,
      thighs,
      knees,
      ankles,
      notes,
      date,
    } = req.body;

    // ✅ Extract user_id from JWT (added by secureRoute middleware)
    const user_id = req.user?.id || req.user?.sub;

    // ✅ Validate required fields
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized: Missing user ID from JWT' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // ✅ Normalize date to YYYY-MM-DD format
    let normalizedDate = date;
    if (date.includes('/')) {
      normalizedDate = date.replace(/\//g, '-').split('-').reverse().join('-');
    } else if (date.includes('-')) {
      // Handle DD-MM-YYYY
      const parts = date.split('-');
      if (parts[0].length === 2 && parts[2].length === 4) {
        normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // ✅ Prepare payload with unit conversion
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
      date: normalizedDate,
    };

    // ✅ Insert into `body_measurements` table
    const { data, error } = await supabase.from('body_measurements').insert([payload]);

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: '✅ Measurements logged successfully',
      data,
    });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
