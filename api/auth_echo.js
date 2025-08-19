/**
 * ✅ Auth Echo (public)
 * Confirms the Authorization header is present and previews it (safe).
 * Does not touch the DB. Useful for GPT “Allow/Connect” troubleshooting.
 */

'use strict';
const express = require('express');
const router = express.Router();
const secureRoute = require('../lib/authMiddleware');

router.get('/', secureRoute, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
