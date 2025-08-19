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

/**
 * ✅ Ping API (public)
 * Confirms the API is alive. No auth required.
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SlimBuddy API is alive',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;


