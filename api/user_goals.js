// api/user_goals.js
/**
 * ✅ User Goals API
 * - Stores or updates a goal for the authenticated user
 * - Accepts units in kg, lbs, or st_lbs (stones + pounds) and converts all values to kg for storage
 * - Reads user_id from the JWT (secureRoute)
 * - Optional target_date is stored in YYYY-MM-DD format
 * - Returns the inserted/updated goal record
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

// Normalize DD/MM/YYYY or DD-MM-YYYY → YYYY-MM-DD
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).replace(/\//g, '-');
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr; // assume already ISO
}

// Convert any incoming value to kg
function toKg({ value, unit, stones, pounds }) {
  if (!unit || unit === 'kg') {
    if (value == null) throw new Error('target_value is required when unit is kg');
    return Number(value);
  }
  if (unit === 'lbs') {
    if (value == null) throw new Error('target_value is required when unit is lbs');
    return Number(value) * 0.45359237;
  }
  if (unit === 'st_lbs') {
    const st = Number(stones ?? 0);
    const lb = Number(pounds ?? 0);
    if (stones == null && value != null) {
      // support payloads that send "value" as total pounds while unit=st_lbs
      return Number(value) * 0.45359237;
    }
    const totalLbs = st * 14 + lb;
    return totalLbs * 0.45359237;
  }
  throw new Error('Unsupported unit. Use kg | lbs | st_lbs');
}

/**
 * POST /api/user_goals
 * Body: { goal_type, target_value, unit, target_date?, notes? , stones?, pounds? }
 * Stores: goal_type, target_value (kg), target_date (date)
 */
router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id || req.user?.sub;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const {
      goal_type,
      target_value,         // number (kg or lbs depending on unit)
      unit = 'kg',          // 'kg' | 'lbs' | 'st_lbs'
      target_date,          // optional
      stones,               // optional for st_lbs
      pounds                // optional for st_lbs
    } = req.body || {};

    if (!goal_type) {
      return res.status(400).json({ error: 'Missing required field: goal_type' });
    }
    if (target_value == null && unit !== 'st_lbs') {
      return res.status(400).json({ error: 'Missing required field: target_value' });
    }

    const targetValueKg = toKg({ value: target_value, unit, stones, pounds });
    const normalizedDate = target_date ? normalizeDate(target_date) : null;

    const { data, error } = await supabase
      .from('user_goals')
      .insert([{ user_id, goal_type, target_value: Number(targetValueKg.toFixed(3)), target_date: normalizedDate }])
      .select();

    if (error) throw error;
    return res.json({ message: '✅ Goal saved', data });
  } catch (err) {
    console.error('❌ user_goals error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
