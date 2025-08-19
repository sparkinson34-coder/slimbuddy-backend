// api/log_weight.js
/**
 * ✅ Weight Logging API
 * - Inserts a weight record for the authenticated user into weight_logs
 * - Accepts units in kg, lbs, or st_lbs (stones + pounds) and converts to kg
 * - Fields: weight (or stones+pounds), unit, date, notes
 * - Reads user_id from the JWT (secureRoute)
 * - If date is not provided, defaults to today (YYYY-MM-DD)
 * - Returns the inserted record for confirmation
 */

// Handler so we can see the resolved user
router.post('/', secureRoute, async (req, res) => {
  console.log('[log_weight] user_id:', req.user?.id); // ⬅️ DEBUG
  // …rest of your code…
});

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

function lbsToKg(lbs) {
  const n = Number(lbs);
  return Number.isFinite(n) ? +(n * 0.45359237).toFixed(2) : null;
}
function stLbsToKg(stones, pounds = 0) {
  const st = Number(stones) || 0;
  const lb = Number(pounds) || 0;
  return +((st * 14 + lb) * 0.45359237).toFixed(2);
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { weight, unit, stones, pounds, date, notes } = req.body;

    if (!unit || !['kg', 'lbs', 'st_lbs'].includes(unit)) {
      return res.status(400).json({ error: 'Missing or invalid unit (kg | lbs | st_lbs).' });
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
    if (weightKg == null || Number.isNaN(weightKg)) {
      return res.status(400).json({ error: 'Invalid target weight after conversion.' });
    }

    const d = normalizeDate(date) || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('weight_logs')
      .insert([{ user_id, date: d, weight: weightKg, unit: 'kg', notes: notes || null }])
      .select();

    if (error) throw error;
    return res.json({ message: '✅ Weight logged successfully', data });
  } catch (err) {
    console.error('log_weight error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
