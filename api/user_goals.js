// api/user_goals.js
/**
 * ✅ User Goals API
 * - Reads user_id from JWT (secureRoute)
 * - Accepts target in kg, lbs, or st_lbs (stones+pounds) and stores kg
 * - Fields:
 *   - goal_type (required, string; e.g. 'weight_loss')
 *   - unit (required: 'kg' | 'lbs' | 'st_lbs')
 *   - target_value (number) OR stones+pounds when unit = 'st_lbs'
 *   - target_date (optional; DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)
 * - Returns the inserted row
 */
'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

/** ✅ Set user goal: stores target_value in kg */
function lbsToKg(lbs){ const n=Number(lbs); return Number.isFinite(n)?+(n*0.45359237).toFixed(2):null; }
function stLbsToKg(st,lb=0){ const s=Number(st)||0,p=Number(lb)||0; return +((s*14+p)*0.45359237).toFixed(2); }

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id; if (!user_id) return res.status(401).json({ error:'Unauthorized' });
    const { goal_type, unit, target_value, stones, pounds, target_date } = req.body || {};
    if (!goal_type) return res.status(400).json({ error:'Missing goal_type' });
    if (!unit || !['kg','lbs','st_lbs'].includes(unit)) return res.status(400).json({ error:"Invalid unit (kg|lbs|st_lbs)" });

    let kg=null;
    if (unit==='kg'){ const n=Number(target_value); if(!Number.isFinite(n)) return res.status(400).json({error:'Invalid target_value (kg)'}); kg=+n.toFixed(2); }
    else if (unit==='lbs'){ if(target_value==null) return res.status(400).json({error:'Missing target_value (lbs)'}); kg=lbsToKg(target_value); }
    else { if(stones==null) return res.status(400).json({error:'Missing stones for st_lbs'}); kg=stLbsToKg(stones,pounds); }
    if (!Number.isFinite(kg) || kg<=0) return res.status(400).json({ error:'Invalid target weight after conversion' });

    const td = target_date ? normalizeDate(target_date) : null;

    const { data, error } = await supabase.from('user_goals').insert([{ user_id, goal_type, target_value: kg, target_date: td }]).select();
    if (error) { console.error('[user_goals] DB:', error.message); return res.status(500).json({ error:'Database error' }); }

    res.json({ message:'✅ User goal logged successfully', data });
  } catch (err) { console.error('user_goals exception:', err); res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
