/**
 * 🩺 /api/auth_echo — Debug who we think you are
 *
 * - Use for smoke-tests from GPT or PowerShell.
 * - Works with X-Connect-Key (preferred) or Bearer JWT (fallback).
 */

const express = require('express');
const router = express.Router();

const secureRoute = require('../lib/authMiddleware');

router.get('/', secureRoute, async (req, res) => {
  try {
    return res.json({
      ok: true,
      user: {
        id: req.user?.id || null,
        email: req.user?.email || null,
      },
    });
  } catch (e) {
    console.error('auth_echo error:', e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
