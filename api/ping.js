// api/ping.js
/**
 * ✅ Ping API
 * - Simple public route to check if the API is running
 * - Does not require authentication
 * - Returns a basic status response
 */

const express = require('express');
const router = express.Router();

// ✅ No authentication required for uptime checks
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SlimBuddy API is alive',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
