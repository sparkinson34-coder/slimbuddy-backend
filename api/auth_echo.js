// api/auth_echo.js
/**
 * ✅ Auth Echo (public)
 * Confirms GPT is actually attaching a Bearer token.
 * NEVER hits Supabase or DB; just reflects header presence.
 */
'use strict';

const express = require('express');
const router = express.Router();

/**
 * ✅ Auth Echo (public)
 * Confirms the Authorization header is present and previews it (safe).
 * Does not touch the DB. Useful for GPT “Allow/Connect” troubleshooting.
 */
router.get('/', (req, res) => {
  const raw = req.headers.authorization || '';
  res.json({
    ok: true,
    hasAuth: Boolean(raw),
    authPreview: raw ? raw.slice(0, 24) + '…' : '(none)'
  });
});

module.exports = router;
