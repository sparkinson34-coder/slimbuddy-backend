/**
 * ✅ Weight Logging API
 * - Accepts weight, date, notes
 * - Converts units to kg
 * - Uses user_id from JWT, NOT the request body
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const secureRoute = require('../lib/authMiddleware');

// ✅ Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.post('/', secureRoute, async (req, res) => {
  const { weight, date, unit, notes } = req.body;
  const user_id = req.user.sub || req.user.id; // ✅ Extracted from JWT payload

  // Validate fields
  if (!weight || !unit || !date) {
    return res.status(400).json({ error: 'Missing required fields: weight, unit, date.' });
  }

  // ✅ Normalize date (DD-MM-YYYY → YYYY-MM-DD)
  let normalizedDate = date;
  if (date.includes('/')) {
    const [day, month, year] = date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  } else if (date.includes('-')) {
    const [day, month, year] = date.split('-');
    normalizedDate = `${year}-${month}-${day}`;
  }

  // ✅ Convert to kg
  let weightInKg = weight;
  if (unit === 'lbs') weightInKg = weight * 0.453592;
  if (unit === 'st_lbs') weightInKg = weight * 0.453592;

  try {
    const { data, error } = await supabase
      .from('weight_logs')
      .insert([{ user_id, weight: weightInKg, unit: 'kg', date: normalizedDate, notes }]);

    if (error) throw error;

    res.json({ message: 'Weight logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
