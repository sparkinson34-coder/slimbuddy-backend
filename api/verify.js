// api/connect/verify.js
const express = require('express');
const router = express.Router();
const secureRoute = require('../lib/authMiddleware');

router.get('/', secureRoute, async (req, res) => {
  return res.json({ ok: true, via: req.authVia || 'unknown', user_id: req.user?.id || null });
});

module.exports = router;

