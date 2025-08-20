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
// server.js
'use strict';

/**
 * SlimBuddy Backend (Express)
 * - Explicit route mounts (no fragile auto-scanner)
 * - Request audit logging
 * - CORS + JSON
 * - Spec endpoints (import.yaml public, api-spec.yaml behind Basic Auth)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- core middleware ---
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());

// --- tiny request audit log ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const auth = req.headers.authorization
      ? (req.headers.authorization.startsWith('Bearer ')
          ? 'Bearer …'
          : req.headers.authorization.startsWith('Basic ')
          ? 'Basic …'
          : '(other)')
      : '-';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms) auth:${auth}`);
  });
  next();
});

// --- simple health endpoints ---
app.get('/', (_req, res) => {
  res.send('SlimBuddy API running!');
});
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});
// Keep /api/ping as a simple inline health (also have a router version available if needed)
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, message: 'SlimBuddy backend is alive!', timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  if (process.env.DEBUG_HEADERS === "true") {
    console.log(`[Headers ${req.method} ${req.originalUrl}]`, {
      auth: req.headers.authorization || "-",
      contentType: req.headers["content-type"] || "-",
    });
  }
  next();
});

/* ================================
 * ✅ EXPLICIT ROUTE MOUNTS (robust)
 * ================================ */
// Helpers are in /lib (imported *inside* route files)
app.use('/api/auth_echo',            require('./api/auth_echo'));
app.use('/api/log_meal',             require('./api/log_meal'));
app.use('/api/log_weight',           require('./api/log_weight'));
app.use('/api/log_exercise',         require('./api/log_exercise'));
app.use('/api/log_measurements',     require('./api/log_measurements'));
app.use('/api/user_goals',           require('./api/user_goals'));
app.use('/api/update_user_settings', require('./api/update_user_settings'));
app.use('/api/update_food_value',    require('./api/update_food_value'));
app.use('/api/weight_graph',         require('./api/weight_graph'));
app.use('/api/user_profile',         require('./api/user_profile'));
app.use('/api/env_check',            require('./api/env_check')); // optional diagnostics, if present

/* =========================================
 * 🔐 BASIC AUTH *ONLY* FOR SPEC ENDPOINTS
 * ========================================= */
function specBasicAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(hdr.split(' ')[1], 'base64').toString().split(':');
  if (user === process.env.SPEC_USER && pass === process.env.SPEC_PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
  return res.status(401).send('Invalid credentials');
}

// Serve the OpenAPI spec with basic auth
app.get('/spec/api-spec.yaml', specBasicAuth, (_req, res) => {
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

// Public import.yaml (if you’re using GPT “Import from URL”)
app.get('/spec/import.yaml', (_req, res) => {
  // If you later add HMAC signing, gate it here.
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'import.yaml'));
});

// --- 404 + error handlers ---
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy API listening on port ${PORT}`);
});
