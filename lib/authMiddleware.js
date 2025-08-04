const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function secureRoute(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    // ✅ Validate token with Supabase
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error || !user?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // ✅ Attach user info to request
    req.user = user.user;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = secureRoute;
