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
    food_name,
    syn_value,
    notes,
    is_healthy_extra_b
  } = req.body;

  if (!user_id || !food_name || typeof syn_value !== 'number') {
    return res.status(400).json({
      error: 'Missing required fields. Please include user_id, food_name, and syn_value.'
    });
  }

  const { data, error } = await supabase.from('user_food_overrides').insert([
    {
      user_id,
      food_name,
      syn_value,
      is_healthy_extra_b,
      notes
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Food value override logged successfully', data });
});

module.exports = router; 
