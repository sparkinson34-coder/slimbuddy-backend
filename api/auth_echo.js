// api/auth_echo.js
'use strict';
const express = require('express');
const router = express.Router();

/**
 * ✅ Auth Echo (public)
 * Confirms GPT is actually attaching a Bearer token.
 * NEVER hits Supabase or DB; just reflects header presence.
 */
'use strict';
const express = require('express');
const router = express.Router();

/** ✅ Echo Authorization header presence (no DB) */
router.get('/', (req, res) => {
  const raw = req.headers.authorization || '';
  res.json({ ok: true, hasAuth: !!raw, authPreview: raw ? raw.slice(0, 24) + '…' : '(none)' });
});

module.exports = router;
