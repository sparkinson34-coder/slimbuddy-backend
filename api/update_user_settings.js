// api/update_user_setting.js
/**
 * ✅ Update User Settings API
 * - Updates the user profile/settings record for the authenticated user
 * - Fields can include preferred units, dietary preferences, notification settings, etc.
 * - Reads user_id from the JWT (secureRoute)
 * - Returns the updated settings record for confirmation
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.patch('/', secureRoute, async (req, res) => {
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

  // ✅ Remove undefined fields
  const updates = {
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
  };
  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user_id);

    if (error) throw error;

    res.json({ message: 'User settings updated successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
