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
    activity,
    duration_minutes,
    intensity,
    calories_burned,
    date,
    notes
  } = req.body;
  if (!user_id || !activity || typeof duration_minutes !== 'number' || !date) {
    return res.status(400).json({
      error: 'Missing required fields. Please include user_id, activity, duration_minutes, and date.'
    });
  }
  const { data, error } = await supabase.from('fitness_logs').insert([
    {
      user_id,
      activity,
      duration_minutes,
      intensity,
      calories_burned,
      date,
      notes
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Exercise logged successfully', data });
});

module.exports = router;
