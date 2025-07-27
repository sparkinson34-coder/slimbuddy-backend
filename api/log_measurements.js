const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  const { user_id, chest, waist, hips, date, notes } = req.body;

  // ✅ Normalize date
  let normalizedDate = date;
  if (date && date.includes('/')) {
    const [day, month, year] = date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  }

  if (!user_id || (!chest && !waist && !hips)) {
    return res.status(400).json({ error: 'Missing required fields: user_id and at least one measurement.' });
  }

  try {
    const { data, error } = await supabase.from('measurement_logs').insert([
      { user_id, chest, waist, hips, date: normalizedDate, notes }
    ]);
    if (error) throw error;
    res.json({ message: 'Measurements logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;