// api/env_check.js
const express = require('express');
const router = express.Router();

// returns which critical envs are present (true/false) without exposing values
router.get('/', (_req, res) => {
  const reqd = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'SPEC_USER',
    'SPEC_PASS',
    'SPEC_IMPORT_SECRET'
  ];
  const seen = Object.fromEntries(reqd.map(k => [k, !!process.env[k]]));
  res.json({ ok: true, envPresent: seen });
});

module.exports = router;
