// api/log_weight.js
/**
 * ✅ Weight Logging API
 * - Accepts kg, lbs, or stones+pounds
 * - Converts and stores weight in kg
 * - Persists `unit: 'kg'` since the stored value is kg
 * - Uses user_id from JWT (secureRoute middleware)
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
    // If already ISO (yyyy-mm-dd), this will still be fine if dd>31 check is needed later
    if (yyyy.length === 4) return `${yyyy}-${mm}-${dd}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr; // assume already ISO
}

// Convert incoming payload to kg
function toKg({ weight, unit, stones, pounds }) {
  if (!unit) throw new Error('unit is required: kg | lbs | st_lbs');

  if (unit === 'kg') {
    if (weight == null) throw new Error('weight is required for kg');
    return Number(weight);
  }

  if (unit === 'lbs') {
    if (weight == null) throw new Error('weight is required for lbs');
    return Number(weight) * 0.45359237;
  }

  if (unit === 'st_lbs') {
    const st = Number(stones ?? 0);
    const lb = Number(pounds ?? 0);
    if (isNaN(st) || st < 0) throw new Error('stones must be a non-negative number');
    if (isNaN(lb) || lb < 0) throw new Error('pounds must be a non-negative number');
    if (stones == null && pounds == null) {
      throw new Error('stones (and optional pounds) required for st_lbs');
    }
    const totalLbs = st * 14 + lb;
    return totalLbs * 0.45359237;
  }

  throw new Error('Unsupported unit. Use kg | lbs | st_lbs');
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user?.id || req.user?.sub; // from JWT
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const { weight, date, unit, notes, stones, pounds } = req.body || {};
    if (!date || !unit) {
      return res.status(400).json({ error: 'Missing required fields: date, unit' });
    }

    // Convert and normalize
    const weightInKg = toKg({ weight, unit, stones, pounds });
    const normalizedDate = normalizeDate(date);

    const payload = {
      user_id,
      date: normalizedDate,
      weight: Number(Number(weightInKg).toFixed(3)), // store kg to 3dp
      unit: 'kg', // stored unit is kg for consistency
      notes: notes || null,
    };

    const { data, error } = await supabase.from('weight_logs').insert([payload]).select();
    if (error) throw error;

    return res.json({ message: '✅ Weight logged successfully', data });
  } catch (err) {
    console.error('❌ Weight Log Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
