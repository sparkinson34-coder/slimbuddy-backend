const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  const { user_id, exercise_type, duration, calories_burned, date, notes } = req.body;

  // ✅ Normalize date
  let normalizedDate = date;
  if (date && date.includes('/')) {
    const [day, month, year] = date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  }

  if (!user_id || !exercise_type || !duration) {
    return res.status(400).json({ error: 'Missing required fields: user_id, exercise_type, duration.' });
  }

  try {
    const { data, error } = await supabase.from('exercise_logs').insert([
      { user_id, exercise_type, duration, calories_burned, date: normalizedDate, notes }
    ]);
    if (error) throw error;
    res.json({ message: 'Exercise logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
