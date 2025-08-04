/**
 * ✅ Weight Logging API
 * - Accepts weight, date, notes
 * - Converts units to kg
 * - Uses user_id from JWT, NOT the request body
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  const { weight, date, unit, notes } = req.body;

  // ✅ Extract user_id from decoded JWT
  const user_id = req.user.id;

  // ✅ Normalize date
  let normalizedDate = date;
  if (date.includes('/')) {
    const [day, month, year] = date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  } else if (date.includes('-')) {
    const [day, month, year] = date.split('-');
    normalizedDate = `${year}-${month}-${day}`;
  }

  // ✅ Convert weight to kg
  let weightInKg = parseFloat(weight);
  if (unit === 'lbs') {
    weightInKg *= 0.453592;
  }

  if (!weight || !normalizedDate) {
    return res.status(400).json({ error: 'Missing required fields: weight, date.' });
  }

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
