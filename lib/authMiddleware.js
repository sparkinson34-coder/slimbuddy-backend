// authMiddleware.js
'use strict';

module.exports = function secureRoute(req, res, next) {
  let authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  // If header already starts with Bearer, extract the token
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If user typed extra words like "my token is ...", try to find the JWT pattern
  const jwtRegex = /([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)/;
  const match = token.match(jwtRegex);

  if (!match) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  token = match[1]; // just the JWT
  req.userToken = token;

  // Rebuild the header in the correct form for Supabase
  req.headers['authorization'] = `Bearer ${token}`;

  next();
};

