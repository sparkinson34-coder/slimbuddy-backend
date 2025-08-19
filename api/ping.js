// api/ping.js
/**
 * ✅ Ping API
 * - Simple public route to check if the API is running
 * - Does not require authentication
 * - Returns a basic status response
 */

'use strict';
const express = require('express');
const router = express.Router();

/** ✅ Health check (no auth) */
router.get('/', (_req, res) => {
  res.json({ ok: true, message: 'SlimBuddy backend is alive!', timestamp: new Date().toISOString() });
});

module.exports = router;
