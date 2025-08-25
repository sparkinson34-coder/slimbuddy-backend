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

// Simple request logger
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    const dur = Date.now() - started;
    const authKind = req.headers.authorization
      ? req.headers.authorization.split(' ')[0]
      : '-';
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${dur}ms) auth:${authKind}`
    );
  });
  next();
});

// ---------- Home + health ----------
app.get('/', (req, res) => res.send('SlimBuddy API running!'));
app.get('/api/ping', (req, res) =>
  res.json({ ok: true, message: 'SlimBuddy backend is alive!' })
);

// ---------- Spec basic-auth (SPEC_USER / SPEC_PASS) ----------
function specBasicAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64')
    .toString()
    .split(':');
  if (user === process.env.SPEC_USER && pass === process.env.SPEC_PASS) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
  return res.status(401).send('Invalid credentials');
}

// Serve OpenAPI files
app.get('/spec/api-spec.yaml', specBasicAuth, (req, res) => {
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});
app.get('/spec/import.yaml', (req, res) => {
  // If you use signed links, verify here; else serve directly
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'import.yaml'));
});

// ---------- Mount API routes (flat files in /api) ----------
app.use('/api/auth_echo', require('./api/auth_echo.js'));

app.use('/api/log_meal', require('./api/log_meal.js'));
app.use('/api/log_weight', require('./api/log_weight.js'));
app.use('/api/log_exercise', require('./api/log_exercise.js'));
app.use('/api/log_measurements', require('./api/log_measurements.js'));
app.use('/api/user_goals', require('./api/user_goals.js'));
app.use('/api/update_user_settings', require('./api/update_user_settings.js'));
app.use('/api/update_food_value', require('./api/update_food_value.js'));
app.use('/api/weight_graph', require('./api/weight_graph.js'));
app.use('/api/user_profile', require('./api/user_profile.js'));

// ---------- Connect endpoints (single file) ----------
// api/connect.js should export a router that defines:
//   POST /issue
//   GET  /verify
app.use('/api/connect', require('./api/connect.js'));

// ---------- 404 + error handling ----------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy API listening on port ${PORT}`);
});