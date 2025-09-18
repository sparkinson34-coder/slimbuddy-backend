/**
 * ✅ Ping API with DB Warmup
 * - Public route for health checks
 * - Verifies backend is alive
 * - Calls Supabase 'ping' RPC to keep the DB awake
 */

'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc('ping'); // lightweight DB call
    if (error) throw error;

    res.json({
      ok: true,
      message: 'SlimBuddy backend is alive!',
      db: data || 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('ping error (db):', e);
    res.status(502).json({
      ok: false,
      message: 'Backend up but DB unreachable',
      error: e.message
    });
  }
});

module.exports = router;
