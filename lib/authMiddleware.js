// /lib/authMiddleware.js

const supabase = require('./supabaseClient');

async function secureRoute(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  // ✅ user is valid
  req.user = user;
  next();
}

module.exports = secureRoute;
