// api/auth_echo.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const auth = req.headers.authorization || '';
  const redacted = auth ? auth.slice(0, 16) + '…' : '';
  res.json({
    ok: true,
    method: req.method,
    path: req.originalUrl,
    hasAuth: !!auth,
    authPreview: redacted
  });
});

module.exports = router;
