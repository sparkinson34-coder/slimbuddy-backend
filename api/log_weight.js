// api/log_weight.js
/**
 * ✅ Weight Logging API
 * - Inserts a weight record for the authenticated user into weight_logs
 * - If date is not provided, defaults to today (YYYY-MM-DD)
 * - Returns the inserted record for confirmation
 */

'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

/**
 * ✅ Weight Logging API
 * - Accepts kg | lbs | st_lbs and stores kg
 * - Body: { date?, unit, weight?, stones?, pounds?, notes? }
 * - Reads user_id from JWT via secureRoute
 */
function lbsToKg(lbs) {
  const n = Number(lbs);
  return Number.isFinite(n) ? +(n * 0.45359237).toFixed(2) : null;
}
function stLbsToKg(st, lb = 0) {
  const s = Number(st) || 0;
  const p = Number(lb) || 0;
  return +((s * 14 + p) * 0.45359237).toFixed(2);
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const { unit, weight, stones, pounds, date, notes } = req.body || {};
    if (!unit || !['kg', 'lbs', 'st_lbs'].includes(unit)) {
      return res.status(400).json({ error: "Missing or invalid unit (kg|lbs|st_lbs)." });
    }

    let weightKg = null;
    if (unit === 'kg') {
      const n = Number(weight);
      if (!Number.isFinite(n)) return res.status(400).json({ error: 'Missing or invalid weight (kg).' });
      weightKg = +n.toFixed(2);
    } else if (unit === 'lbs') {
      if (weight == null) return res.status(400).json({ error: 'Missing weight (lbs).' });
      weightKg = lbsToKg(weight);
    } else if (unit === 'st_lbs') {
      if (stones == null) return res.status(400).json({ error: 'Missing stones for st_lbs.' });
      weightKg = stLbsToKg(stones, pounds);
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return res.status(400).json({ error: 'Invalid target weight after conversion.' });
    }

    const d = normalizeDate(date) || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('weight_logs')
      .insert([{ user_id, date: d, weight: weightKg, unit: 'kg', notes: notes ?? null }])
      .select();

    if (error) {
      console.error('[log_weight] supabase error:', error.message);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.json({ message: '✅ Weight logged successfully', data });
  } catch (err) {
    console.error('log_weight error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

