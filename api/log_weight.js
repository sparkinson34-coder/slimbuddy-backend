/**
 * Route: /api/log_weight
 * Purpose: Insert a new weight log entry for the authenticated user.
 *
 * Notes:
 * - Requires Authorization header with "Bearer <JWT>".
 * - Expects JSON body with: { date, weight, unit, notes }
 * - Saves to "weight_logs" table in Supabase.
 * - Debug mode: If request includes header "X-Debug: true",
 *   then detailed error info from Supabase will be returned.
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const { normalizeDate } = require('../lib/date');

// POST /api/log_weight
router.post('/', secureRoute, async (req, res) => {
  try {
    // ✅ Guard: ensure middleware attached a user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized (no user in request)' });
    }

    const userId = req.user.id; // from authMiddleware
    const { date, weight, unit, notes } = req.body;

    if (!date || !weight) {
      return res.status(400).json({ error: 'Date and weight are required' });
    }

    // Normalize date into YYYY-MM-DD
    const normalizedDate = normalizeDate(date);

    const insert = {
      user_id: userId,
      date: normalizedDate,
      weight: parseFloat(weight),
      unit: unit || 'kg',
      notes: notes || null,
    };

    // Insert into supabase
    const { data, error } = await supabase
      .from('weight_logs')
      .insert([insert])
      .select();

    if (error) {
      console.error('log_weight insert error:', error);

      // Debug output if client explicitly requests it
      if (req.headers['x-debug'] === 'true') {
        return res.status(500).json({
          error: 'Server error inserting weight log',
          debug: {
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        });
      }

      return res.status(500).json({ error: 'Server error inserting weight log' });
    }

    res.json({
      ok: true,
      message: 'Weight log saved successfully',
      entry: data[0],
    });

  } catch (err) {
    console.error('Unexpected error in log_weight:', err);

    if (req.headers['x-debug'] === 'true') {
      return res.status(500).json({
        error: 'Unexpected server error',
        debug: { message: err.message, stack: err.stack },
      });
    }

    res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
