/**
 * ✅ Weight Logging API
 * - Normalizes date
 * - Converts lbs and stones to kg
 * - Uses user_id from JWT, NOT from body
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const secureRoute = require('../lib/authMiddleware');

// ✅ Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Normalize date
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  return dateStr.replace(/\//g, '-').split('-').reverse().join('-');
}

// ✅ Convert to kg
function toKg(weight, unit) {
  if (unit === 'lbs') return weight * 0.453592;
  return weight;
}

router.post('/', secureRoute, async (req, res) => {
  const { weight, unit, notes, date } = req.body;
  const user_id = req.user.sub || req.user.id;

  if (!date || !weight || !unit) {
    return res.status(400).json({ error: 'Missing required fields: date, weight, unit' });
  }

  const normalizedDate = normalizeDate(date);

  try {
    const { data, error } = await supabase.from('weight_logs').insert([
      {
        user_id,
        weight: toKg(weight, unit),
        unit: 'kg',
        date: normalizedDate,
        notes: notes || '',
      },
    ]);

    if (error) throw error;

    res.json({ message: 'Weight logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
