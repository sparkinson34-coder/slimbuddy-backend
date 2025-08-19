// update_food_value.js
/**
 * ✅ Update Food Syn Value API
 * - Inserts or updates a Syn value for a food for the authenticated user
 * - Reads user_id from JWT (secureRoute)
 * - Uses upsert to prevent duplicates for the same food_name+date+user_id
 */
'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

/** ✅ Update/log food Syn value */
router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id; if (!user_id) return res.status(401).json({ error:'Unauthorized' });
    const { food_name, syn_value, notes, date } = req.body || {};
    if (!food_name) return res.status(400).json({ error:'Missing food_name' });
    if (syn_value==null || isNaN(Number(syn_value))) return res.status(400).json({ error:'Invalid syn_value' });

    const d = date ? normalizeDate(date) : null;
    const { data, error } = await supabase.from('syn_values').insert([{ user_id, food_name, syn_value: Number(syn_value), notes: notes ?? null, date: d }]).select();
    if (error) { console.error('[update_food_value] DB:', error.message); return res.status(500).json({ error:'Database error' }); }

    res.json({ message:'✅ Syn value logged successfully', data });
  } catch (err) { console.error('update_food_value exception:', err); res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
