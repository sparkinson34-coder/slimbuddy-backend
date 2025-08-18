// server.js
/**
 * SlimBuddy Backend — server.js
 * -------------------------------------------------------------
 * What this file does:
 * 1) Loads env/config, boots an Express API with CORS+JSON.
 * 2) Adds a tiny request-audit logger (method, path, status, ms).
 * 3) Mounts every /api/* route (explicit .js file names).
 * 4) Exposes a public OpenAPI import file + a Basic-Auth protected spec.
 * 5) Provides /api/ping (health) and /healthz (infra health).
 * 6) Finishes with 404 + error handlers and starts the server.
 * -------------------------------------------------------------
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

/* -------------------------------------------------------------
 * Core middleware
 * ----------------------------------------------------------- */
app.use(cors());
app.use(express.json());           // parse application/json bodies
app.set('trust proxy', true);      // correct client IPs if behind proxy

/* -------------------------------------------------------------
 * Tiny request audit (appears in Railway logs)
 * ----------------------------------------------------------- */
app.use((req, res, next) => {
  const t0 = Date.now();
  const auth = req.headers.authorization || '';
  const briefAuth = auth ? auth.slice(0, 12) + '…' : '-';
  res.on('finish', () => {
    const ms = Date.now() - t0;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms) auth:${briefAuth}`
    );
  });
  next();
});

/* -------------------------------------------------------------
 * Simple home & health endpoints
 * ----------------------------------------------------------- */
app.get('/', (req, res) => {
  res.send('SlimBuddy API running!');
});

// Infra health (for uptime checks)
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// API health (used by you for quick checks)
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'SlimBuddy backend is alive!' });
});

/* -------------------------------------------------------------
 * Helper to mount routers (with strong file resolution)
 * - We pass explicit .js filenames, but also resolve safely.
 * ----------------------------------------------------------- */
function mountIfExists(routePath, routerRelFile) {
  try {
    const resolved = require.resolve(path.join(__dirname, routerRelFile));
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const router = require(resolved);
    app.use(routePath, router);
    console.log(`Mounted ${routePath} from ${resolved}`);
  } catch (e) {
    console.warn(`Skipped ${routePath}: ${routerRelFile} (${e.message})`);
  }
}

/* -------------------------------------------------------------
 * Mount all API routes (EXPLICIT .js filenames)
 *   IMPORTANT: Each router file must export an Express Router and
 *   define handlers on '/', e.g. router.post('/')…
 * ----------------------------------------------------------- */
mountIfExists('/api/log_meal',             './api/log_meal.js');
mountIfExists('/api/log_weight',           './api/log_weight.js');
mountIfExists('/api/log_exercise',         './api/log_exercise.js');
mountIfExists('/api/log_measurements',     './api/log_measurements.js');
mountIfExists('/api/user_goals',           './api/user_goals.js');
mountIfExists('/api/update_user_settings', './api/update_user_settings.js');
mountIfExists('/api/update_food_value',    './api/update_food_value.js');
mountIfExists('/api/weight_graph',         './api/weight_graph.js');
mountIfExists('/api/user_profile',         './api/user_profile.js');
mountIfExists('/api/auth_echo',            './api/auth_echo.js')

// (Optional) if you also have a dedicated /api/ping router file:
// mountIfExists('/api/ping',                 './api/ping.js');

/* -------------------------------------------------------------
 * OpenAPI spec endpoints
 * - /spec/api-spec.yaml  (Basic Auth — SPEC_USER/SPEC_PASS)
 * - /spec/import.yaml    (Public — used by GPT to import)
 * ----------------------------------------------------------- */
// Basic Auth only for the human-readable spec
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

// Public import file for GPT (no auth)
app.get('/spec/import.yaml', (req, res) => {
  const filePath = path.join(__dirname, 'spec', 'import.yaml');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('spec/import.yaml not found');
  }
  res.type('text/yaml').send(fs.readFileSync(filePath, 'utf8'));
});

// Protected full OpenAPI (human/devs)
app.get('/spec/api-spec.yaml', specBasicAuth, (req, res) => {
  const filePath = path.join(__dirname, 'spec', 'api-spec.yaml');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('spec/api-spec.yaml not found');
  }
  res.type('text/yaml').send(fs.readFileSync(filePath, 'utf8'));
});

/* -------------------------------------------------------------
 * 404 + error handlers (must be last)
 * ----------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

/* -------------------------------------------------------------
 * Start server
 * ----------------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy API listening on port ${PORT}`);
});
