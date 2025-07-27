const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  const { user_id, food_name, syn_value, notes, is_healthy_extra_b } = req.body;

  if (!user_id || !food_name || typeof syn_value !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: user_id, food_name, syn_value.' });
  }

  try {
    const { data, error } = await supabase.from('user_food_overrides').insert([
      { user_id, food_name, syn_value, is_healthy_extra_b, notes }
    ]);
    if (error) throw error;
    res.json({ message: 'Food value override logged successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;