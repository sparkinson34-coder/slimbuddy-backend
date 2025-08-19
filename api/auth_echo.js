/**
 * ✅ Auth Echo (public)
 * Confirms the Authorization header is present and previews it (safe).
 * Does not touch the DB. Useful for GPT “Allow/Connect” troubleshooting.
 */

'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const raw = req.headers.authorization || '';
  res.json({
    ok: true,
    hasAuth: Boolean(raw),
    authPreview: raw ? raw.slice(0, 24) + '…' : '(none)'
  });
});

module.exports = router;
