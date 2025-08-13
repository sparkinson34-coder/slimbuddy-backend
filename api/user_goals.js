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
  const st = Number(stones);
  const lb = Number(pounds || 0);
  if (!Number.isFinite(st) || !Number.isFinite(lb)) return null;
  return +((st * 14 + lb) * 0.45359237).toFixed(2);
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { goal_type, unit, target_value, stones, pounds, target_date } = req.body;

    // Basic required fields
    if (!goal_type || typeof goal_type !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid goal_type.' });
    }
    if (!unit || !['kg', 'lbs', 'st_lbs'].includes(unit)) {
      return res.status(400).json({ error: "Missing or invalid unit. Use 'kg', 'lbs', or 'st_lbs'." });
    }

    // Convert to kg
    let targetValueKg = null;
    if (unit === 'kg') {
      const n = Number(target_value);
      if (!Number.isFinite(n)) return res.status(400).json({ error: 'Missing or invalid target_value (kg).' });
      targetValueKg = +n.toFixed(2);
    } else if (unit === 'lbs') {
      if (target_value == null) return res.status(400).json({ error: 'Missing target_value (lbs).' });
      targetValueKg = lbsToKg(target_value);
    } else if (unit === 'st_lbs') {
      if (stones == null) return res.status(400).json({ error: 'Missing stones for st_lbs.' });
      targetValueKg = stLbsToKg(stones, pounds);
    }

    if (targetValueKg == null || !Number.isFinite(targetValueKg) || targetValueKg <= 0) {
      return res.status(400).json({ error: 'Invalid target weight after conversion.' });
    }

    // Optional date normalization
    let targetDateIso = null;
    if (target_date != null && target_date !== '') {
      targetDateIso = normalizeDate(target_date);
      if (!targetDateIso) {
        return res.status(400).json({ error: 'Invalid target_date. Use YYYY-MM-DD or DD/MM/YYYY.' });
      }
    }

    const { data, error } = await supabase
      .from('user_goals')
      .insert([{
        user_id,
        goal_type,
        target_value: targetValueKg,   // stored in kg
        target_date: targetDateIso     // may be null
      }])
      .select();

    if (error) throw error;

    return res.json({ message: '✅ User goal logged successfully', data });
  } catch (err) {
    console.error('user_goals error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
