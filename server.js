/**
 * SlimBuddy Backend – Express bootstrap
 *
 * What this file does
 * -------------------
 * - Loads env and sets up Express (CORS + JSON body parsing).
 * - Logs every request (method, path, status, auth presence).
 * - Optional SAFE_MODE: serve only ping + spec to isolate GPT import issues.
 * - Protects spec endpoints with BASIC auth (SPEC_USER / SPEC_PASS).
 * - Mounts all API route files under /api/*, including nested /api/connect/verify.
 * - Standard 404 + error handlers.
 *
 * Folder layout expected
 * ----------------------
 * slimbuddy-backend/
 * ├── api/
 * │   ├── connect/
 * │   │   └── verify.js           -> mounts at /api/connect/verify
 * │   ├── auth_echo.js            -> /api/auth_echo
 * │   ├── connect.js              -> /api/connect
 * │   ├── env_check.js            -> /api/env_check
 * │   ├── log_meal.js             -> /api/log_meal
 * │   ├── log_weight.js           -> /api/log_weight
 * │   ├── log_exercise.js         -> /api/log_exercise
 * │   ├── log_measurements.js     -> /api/log_measurements
 * │   ├── user_goals.js           -> /api/user_goals
 * │   ├── update_user_settings.js -> /api/update_user_settings
 * │   ├── update_food_value.js    -> /api/update_food_value
 * │   ├── user_profile.js         -> /api/user_profile
 * │   └── weight_graph.js         -> /api/weight_graph
 * ├── lib/
 * │   ├── authMiddleware.js
 * │   ├── date.js
 * │   └── supabaseClient.js
 * └── spec/
 *     ├── api-spec.yaml
 *     └── import.yaml
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ---------- Core middleware ----------
app.use(cors());
app.use(express.json());

// ---------- Tiny request logger ----------
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const authHdr = req.headers.authorization;
    const authKind = authHdr
      ? (authHdr.startsWith('Bearer ') ? 'Bearer …' : authHdr.split(' ')[0] || '(other)')
      : '-';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms) auth:${authKind}`);
  });
  next();
});

// ---------- Home (optional) ----------
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'SlimBuddy backend is running' });
});

// ---------- Basic auth just for serving spec files ----------
function specBasicAuth(req, res, next) {
  const user = process.env.SPEC_USER || '';
  const pass = process.env.SPEC_PASS || '';
  if (!user || !pass) return res.status(503).send('Spec auth not configured');

  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
    return res.status(401).send('Authentication required');
  }
  const [u, p] = Buffer.from(header.split(' ')[1], 'base64').toString().split(':');
  if (u === user && p === pass) return next();

  res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
  return res.status(401).send('Invalid credentials');
}

// ---------- Serve OpenAPI specs (protected) ----------
app.get('/spec/api-spec.yaml', specBasicAuth, (_req, res) => {
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

app.get('/spec/import.yaml', (_req, res) => {
  // If you protect this with signature logic, swap this handler accordingly.
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'import.yaml'));
});

// ---------- SAFE_MODE: mount only health + spec ----------
if (String(process.env.SAFE_MODE || '').trim() === '1') {
  console.log('🔒 SAFE_MODE=1: Skipping all API mounts; serving ping + spec only.');
  // Provide a simple ping endpoint even in SAFE_MODE
  app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, message: 'SlimBuddy backend is alive (SAFE_MODE)' });
  });
} else {
  // ---------- Mount API routes ----------

  // Health + diagnostics
  app.use('/api/ping', require('./api/ping.js'));
  app.use('/api/auth_echo', require('./api/auth_echo.js'));
  app.use('/api/env_check', require('./api/env_check.js'));

  // Connect key issuance + verification
  app.use('/api/connect', require('./api/connect.js'));                 // POST /api/connect/issue
  app.use('/api/connect/verify', require('./api/connect/verify.js'));   // POST /api/connect/verify

  // Core app routes
  app.use('/api/log_meal', require('./api/log_meal.js'));
  app.use('/api/log_weight', require('./api/log_weight.js'));
  app.use('/api/log_exercise', require('./api/log_exercise.js'));
  app.use('/api/log_measurements', require('./api/log_measurements.js'));
  app.use('/api/user_goals', require('./api/user_goals.js'));
  app.use('/api/update_user_settings', require('./api/update_user_settings.js'));
  app.use('/api/update_food_value', require('./api/update_food_value.js'));
  app.use('/api/weight_graph', require('./api/weight_graph.js'));
  app.use('/api/user_profile', require('./api/user_profile.js'));
}

// ---------- 404 + error handlers ----------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy API listening on port ${PORT}`);
});
