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
 * ✅ Log Weight Route
 * 
 * POST /api/log_weight
 * 
 * Body options:
 *   { date, weight, unit: "kg"|"lbs", notes? }
 *   { date, unit:"st_lbs", stones, pounds?, notes? }
 *
 * Converts weight into kilograms for storage.
 * Stored in: weight_logs(user_id, date, weight (kg), unit, notes)
 */
router.post('/', secureRoute, async (req, res) => {
  try {
    const user_id = req.user.id;
    let { date, weight, unit, stones, pounds, notes } = req.body || {};

    // Normalize date or default to today
    date = normalizeDate(date);

    // Validate unit
    if (!unit || !['kg', 'lbs', 'st_lbs'].includes(unit)) {
      return res.status(400).json({ error: 'Invalid or missing unit (kg, lbs, st_lbs)' });
    }

    let weightKg;

    if (unit === 'kg') {
      if (typeof weight !== 'number') {
        return res.status(400).json({ error: 'Missing/invalid weight for kg' });
      }
      weightKg = weight;

    } else if (unit === 'lbs') {
      if (typeof weight !== 'number') {
        return res.status(400).json({ error: 'Missing/invalid weight for lbs' });
      }
      weightKg = weight * 0.45359237;

    } else {
      // unit === 'st_lbs'
      if (typeof stones !== 'number') {
        return res.status(400).json({ error: 'Missing stones for st_lbs' });
      }
      const lbsTotal = (stones * 14) + (typeof pounds === 'number' ? pounds : 0);
      weightKg = lbsTotal * 0.45359237;
    }

    // Round to 2 decimal places
    weightKg = Math.round(weightKg * 100) / 100;

    // Build record
    const insert = {
      user_id,
      date,
      weight: weightKg,
      unit,      // keep original unit for reference
      notes: notes || null
    };

    // Insert into supabase
    const { data, error } = await supabase
      .from('weight_logs')
      .insert([insert])
      .select();

    if (error) {
      console.error('log_weight insert error:', error);
      return res.status(500).json({ error: 'Server error inserting weight log' });
    }

    return res.json({
      message: '✅ Weight logged successfully',
      data
    });
  } catch (err) {
    console.error('log_weight fatal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
