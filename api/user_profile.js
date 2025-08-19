// api/user_profile.js
/**
 * ✅ User Profile API
 * - Retrieves the authenticated user’s profile information from Supabase Auth
 * - Reads Bearer JWT from Authorization header
 * - Returns user_id and any relevant metadata from Supabase
 */

'use strict';
const express = require('express');
const router = express.Router();
const secureRoute = require('../lib/authMiddleware');

/** ✅ Returns authenticated user_id from JWT */
router.get('/', secureRoute, async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ error:'Unauthorized' });
  res.json({ user_id });
});

module.exports = router;
