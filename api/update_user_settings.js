// api/update_user_setting.js
/**
 * ✅ Update User Settings API
 * - Uses JWT user_id (req.user.id)
 * - PATCH with only provided fields; does not overwrite unspecified fields
 * - Upserts (inserts if missing, updates if exists) via user_id PK
 * - Returns the saved row
 */
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.patch('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Only include keys that are explicitly provided
    const allowed = [
      'preferred_name', 'tone', 'preferred_weight_unit', 'diet_preference',
      'food_allergies', 'food_dislikes', 'typical_day',
      'healthy_extra_a', 'healthy_extra_b',
      'syn_limit', 'target_weight', 'maintenance_mode_enabled'
    ];

    const updates = { user_id };
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    // Nothing to update?
    if (Object.keys(updates).length === 1) {
      return res.status(400).json({ error: 'No valid fields provided.' });
    }

    // Upsert so a missing row gets created automatically
    const { data, error } = await supabase
      .from('user_settings')
      .upsert([updates], { onConflict: 'user_id' })
      .select();

    if (error) throw error;

    return res.json({ message: '✅ User settings saved', data });
  } catch (err) {
    console.error('update_user_settings error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
