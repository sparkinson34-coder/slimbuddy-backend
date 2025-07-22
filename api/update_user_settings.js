const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

// 🔒 REMOVE THIS LINE BEFORE GOING LIVE — SECURITY DISABLED FOR TESTING ONLY
router.patch('/', async (req, res) => {

// 🔒Enable this command to enable security when we go live by deleting everything before the: router.patch('/', secureRoute, async (req, res) => {

  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body.' });
  }

  const {
    user_id,
    preferred_name,
    tone,
    preferred_weight_unit,
    diet_preference,
    food_allergies,
    food_dislikes,
    typical_day,
    healthy_extra_a,
    healthy_extra_b,
    syn_limit,
    target_weight,
    maintenance_mode_enabled
  } = req.body;

  if (!user_id) {
    return res.status(400).json({
      error: 'Missing required field: user_id.'
    });
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update({
      preferred_name,
      tone,
      preferred_weight_unit,
      diet_preference,
      food_allergies,
      food_dislikes,
      typical_day,
      healthy_extra_a,
      healthy_extra_b,
      syn_limit,
      target_weight,
      maintenance_mode_enabled
    })
    .eq('user_id', user_id);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'User settings updated successfully', data });
});

module.exports = router;

