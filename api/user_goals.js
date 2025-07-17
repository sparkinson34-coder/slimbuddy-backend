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
    target_value,
    target_date
  } = req.body;

  if (!user_id || !goal_type || typeof target_value !== 'number') {
    return res.status(400).json({
      error: 'Missing required fields. Please include user_id, goal_type, and target_value.'
    });
  }

  const { data, error } = await supabase.from('user_goals').insert([
    {
      user_id,
      goal_type,
      target_value,
      target_date
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'User goal logged successfully', data });
});

module.exports = router;
