// server.js
/**
 * SlimBuddy Backend – resilient server.js (Safe Mode)
 * - SAFE_MODE=1 -> only /api/ping and /spec/* served (no API routes).
 * - Defensive route mounts (won’t crash on bad files).
 * - Clear request logs show auth presence.
 * - Spec endpoints: /spec/import.yaml (public), /spec/api-spec.yaml (Basic Auth).
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const SAFE_MODE = process.env.SAFE_MODE === '1';

/* ---------- Environment sanity (warn, don’t exit) ---------- */
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const k of REQUIRED_ENV) {
  if (!process.env[k]) {
    console.warn(`⚠️  ENV missing: ${k} (some routes may fail)`);
  }
}

/* ---------- Core middleware ---------- */
app.use(cors());
app.use(express.json({ limit: '1mb' }));

/* ---------- Request logger (shows auth presence) ---------- */
app.use((req, res, next) => {
  const start = Date.now();
  const raw = req.headers.authorization || req.headers['x-api-key'] || '';
  const tag = raw ? (raw.startsWith('Bearer ') ? 'Bearer …' : '(other)') : '-';
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms) auth:${tag}`
    );
  });
  next();
});

/* ---------- Root ---------- */
app.get('/', (_req, res) => res.send('SlimBuddy API running!'));

/* ---------- Health (no auth) ---------- */
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, message: 'SlimBuddy backend is alive!' });
});

/* ---------- Spec endpoints ---------- */
function specBasicAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    if (!hdr.startsWith('Basic ')) throw new Error('no basic');
    const [user, pass] = Buffer.from(hdr.split(' ')[1], 'base64')
      .toString()
      .split(':');
    if (user === process.env.SPEC_USER && pass === process.env.SPEC_PASS) return next();
  } catch {}
  res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
  return res.status(401).send('Authentication required');
}

// Public import spec (for GPT import)
app.get('/spec/import.yaml', (_req, res) => {
  res.type('text/yaml').sendFile(path.join(__dirname, 'spec', 'import.yaml'));
});

// Protected full spec
app.get('/spec/api-spec.yaml', specBasicAuth, (_req, res) => {
  res.type('text/yaml').sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

/* ---------- Defensive route mounting helper ---------- */
function mountRoute(mountPath, filePath) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const router = require(filePath);
    if (typeof router !== 'function') {
      console.warn(`⚠️  Skipped ${mountPath}: ${filePath} did not export an Express router`);
      return;
    }
    app.use(mountPath, router);
    console.log(`Mounted ${mountPath} from ${filePath}`);
  } catch (err) {
    console.error(`❌ Skipped ${mountPath}: ${filePath} (${err.stack || err.message})`);
  }
}

// --- mount API routes (each file exports an Express Router) ---
app.use('/api/ping', require('./api/ping.js'));
app.use('/api/auth_echo', require('./api/auth_echo.js'));
app.use('/api/env_check', require('./api/env_check.js'));

app.use('/api/log_meal', require('./api/log_meal.js'));
app.use('/api/log_weight', require('./api/log_weight.js'));
app.use('/api/log_exercise', require('./api/log_exercise.js'));
app.use('/api/log_measurements', require('./api/log_measurements.js'));
app.use('/api/user_goals', require('./api/user_goals.js'));
app.use('/api/update_user_settings', require('./api/update_user_settings.js'));
app.use('/api/update_food_value', require('./api/update_food_value.js'));
app.use('/api/weight_graph', require('./api/weight_graph.js'));
app.use('/api/user_profile', require('./api/user_profile.js'));

// ✅ NEW: Connect-key issuing endpoint
app.use('/api/connect', require('./api/connect.js'));

/* ---------- 404 + error handler ---------- */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

/* ---------- Global process error logging ---------- */
process.on('uncaughtException', (e) => console.error('uncaughtException:', e));
process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e));
process.on('SIGTERM', () => console.error('⛔ Received SIGTERM (Railway stopping process)'));

/* ---------- Start server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SlimBuddy API listening on port ${PORT} (SAFE_MODE=${SAFE_MODE ? 'ON' : 'OFF'})`));
