const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  const { user_id, weight, date, unit, notes } = req.body;

  // ✅ Normalize date
  let normalizedDate = date;
  if (date && date.includes('/')) {
    const [day, month, year] = date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  }

  // ✅ Convert weight to kg
  let weightInKg = weight;
  if (unit === 'lbs') {
    weightInKg = weight * 0.453592;
  } else if (unit === 'st_lbs') {
    weightInKg = weight * 0.453592;
  }

  if (!user_id || !weight || !unit || !normalizedDate) {
    return res.status(400).json({ error: 'Missing required fields: user_id, weight, unit, date.' });
  }

  try {
    const { data, error } = await supabase.from('weight_logs').insert([
      { user_id, weight: weightInKg, unit: 'kg', date: normalizedDate, notes }
    ]);
    if (error) throw error;
    res.json({ message: 'Weight logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
