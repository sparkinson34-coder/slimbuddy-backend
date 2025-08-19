// api/log_measurements.js
/**
 * ✅ Body Measurements API
 * - Reads user_id from the JWT (secureRoute)
 * - If date is not provided, defaults to today (YYYY-MM-DD)
 * - Returns the inserted record for confirmation
 */
'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

/** ✅ Log body measurements */
const clean = v => { const n=Number(v); return Number.isFinite(n)?n:null; };

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id; if (!user_id) return res.status(401).json({ error:'Unauthorized' });
    const { date, bust, waist, hips, thighs, neck, arm, under_bust, knees, ankles, notes } = req.body || {};

    const d = normalizeDate(date) || new Date().toISOString().slice(0,10);
    const payload = {
      user_id, date:d,
      bust: clean(bust), waist: clean(waist), hips: clean(hips), thighs: clean(thighs),
      neck: clean(neck), arm: clean(arm), under_bust: clean(under_bust), knees: clean(knees), ankles: clean(ankles),
      notes: notes ?? null
    };
    const { data, error } = await supabase.from('body_measurements').insert([payload]).select();
    if (error) { console.error('[log_measurements] DB:', error.message); return res.status(500).json({ error:'Database error' }); }

    res.json({ message:'✅ Measurements logged successfully', data });
  } catch (err) { console.error('log_measurements exception:', err); res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
