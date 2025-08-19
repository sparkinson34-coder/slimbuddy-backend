// api/update_user_setting.js
/**
 * ✅ Update User Settings API
 * - Reads user_id from JWT (secureRoute)
 * - PATCH with only provided fields (no accidental overwrites)
 * - Upserts into public.user_settings by PK user_id
 * - Casts numeric and boolean fields safely
 * - Updates `updated_at` on every save
 *

'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

/**
 * ✅ Update User Settings (PATCH upsert by user_id)
 * Accepts any subset of:
 * preferred_name, tone, preferred_weight_unit, diet_preference,
 * food_allergies, food_dislikes, typical_day,
 * healthy_extra_a, healthy_extra_b,
 * syn_limit(number), target_weight(number, kg),
 * maintenance_mode_enabled(boolean)
 */
function toNum(v){ if(v===null||v===undefined||v==='') return null; const n=Number(v); return Number.isFinite(n)?n:null; }
function toBool(v){
  if (typeof v==='boolean') return v;
  if (typeof v==='string') {
    const s=v.trim().toLowerCase();
    if (['true','1','yes','y'].includes(s)) return true;
    if (['false','0','no','n'].includes(s)) return false;
  }
  if (typeof v==='number') return v!==0;
  return null;
}

router.patch('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

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
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        updates[k] = cast(req.body[k]);
        changed = true;
      }
    }
    if (!changed) return res.status(400).json({ error: 'No valid fields provided.' });

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(updates, { onConflict: 'user_id' })
      .select();

    if (error) {
      console.error('[update_user_settings] supabase error:', error.message);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.json({ message: '✅ User settings saved', data });
  } catch (err) {
    console.error('update_user_settings error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
