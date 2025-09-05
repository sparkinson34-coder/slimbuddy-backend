'use strict';
/**
 * POST /api/reset
 * Deletes ALL of the current user's SlimBuddy data (profile + goals + all logs).
 * Requires: X-Connect-Key header (handled by auth middleware).
 * Body: { confirm: "RESET" } to avoid accidental taps.
 */
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  try {
    // simple confirmation gate
    const { confirm } = req.body || {};
    if (confirm !== 'RESET') {
      return res.status(400).json({
        ok: false,
        error: 'Confirmation required. Send { "confirm": "RESET" } to proceed.'
      });
    }

    // call secure RPC that deletes only the current user's rows
    const { error } = await supabase.rpc('reset_my_data');
    if (error) {
      console.error('reset_my_data error:', error);
      return res.status(500).json({ ok: false, error: 'Reset failed. Try again shortly.' });
    }

    return res.json({
      ok: true,
      message: '✅ Your data has been cleared. You can run onboarding again now.'
    });
  } catch (e) {
    console.error('POST /api/reset error:', e);
    return res.status(500).json({ ok: false, error: 'Unexpected server error' });
  }
});

module.exports = router;

