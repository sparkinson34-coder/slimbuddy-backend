// api/update_user_setting.js
/**
 * ✅ Update User Settings API
 * - Reads user_id from JWT (secureRoute)
 * - PATCH with only provided fields (no accidental overwrites)
 * - Upserts into public.user_settings by PK user_id
 * - Casts numeric and boolean fields safely
 * - Updates `updated_at` on every save
 */

'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

/** ✅ Update user settings (PATCH upsert by user_id) */
const toNum = v => (v===null||v===undefined||v==='') ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
const toBool = v => (typeof v==='boolean') ? v :
  (typeof v==='string' ? ['true','1','yes','y'].includes(v.trim().toLowerCase()) ? true :
                          ['false','0','no','n'].includes(v.trim().toLowerCase()) ? false : null
                        : (typeof v==='number' ? v!==0 : null));

router.patch('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id; if (!user_id) return res.status(401).json({ error:'Unauthorized' });

    const allowed = {
      preferred_name: v => v ?? null,
      tone: v => v ?? null,
      preferred_weight_unit: v => v ?? null,
      diet_preference: v => v ?? null,
      food_allergies: v => v ?? null,
      food_dislikes: v => v ?? null,
      typical_day: v => v ?? null,
      healthy_extra_a: v => v ?? null,
      healthy_extra_b: v => v ?? null,
      syn_limit: toNum,
      target_weight: toNum,
      maintenance_mode_enabled: toBool
    };

    const updates = { user_id, updated_at: new Date().toISOString() };
    let changed = false;
    for (const [k, cast] of Object.entries(allowed)) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) { updates[k] = cast(req.body[k]); changed = true; }
    }
    if (!changed) return res.status(400).json({ error:'No valid fields provided' });

    const { data, error } = await supabase.from('user_settings').upsert(updates, { onConflict: 'user_id' }).select();
    if (error) { console.error('[update_user_settings] DB:', error.message); return res.status(500).json({ error:'Database error' }); }

    res.json({ message:'✅ User settings saved', data });
  } catch (err) { console.error('update_user_settings exception:', err); res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
