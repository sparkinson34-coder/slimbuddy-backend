const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body.' });
  }

  const {
    user_id,
    goal_type,
    target_value, // numeric value (could be kg, lbs, or stones)
    unit, // e.g., "kg", "lbs", "st_lbs"
    target_date
  } = req.body;

  if (!user_id || !goal_type || typeof target_value !== 'number' || !unit) {
    return res.status(400).json({
      error: 'Missing required fields. Please include user_id, goal_type, target_value, and unit.'
    });
  }

  // ✅ Convert target_value to kg
  let targetValueKg = target_value;
  if (unit === 'lbs') {
    targetValueKg = target_value * 0.453592;
  } else if (unit === 'st_lbs') {
    targetValueKg = target_value * 0.453592;
  }
  // If kg, no conversion needed

  // ✅ Normalize target_date if provided in DD/MM/YYYY
  let normalizedDate = target_date;
  if (target_date && target_date.includes('/')) {
    const [day, month, year] = target_date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  }

  try {
    const { data, error } = await supabase.from('user_goals').insert([
      {
        user_id,
        goal_type,
        target_value: targetValueKg, // ✅ Always store in kg
        target_date: normalizedDate || null
      }
    ]);

    if (error) throw error;

    res.json({ message: 'User goal logged successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;