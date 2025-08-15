// server.js
/**
 * SlimBuddy Backend (Express)
 * - Loads env vars
 * - Sets up CORS + JSON
 * - Mounts API routes (safe even if a route file is missing)
 * - Serves OpenAPI spec:
 *     /spec/api-spec.yaml  -> Basic Auth (humans)
 *     /spec/import.yaml    -> Public (GPT "Import from URL")
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express(); // define app FIRST

// ---------- core middleware ----------
app.use(cors());
app.use(express.json());

// ---------- simple home route ----------
app.get('/', (req, res) => {
  res.send('SlimBuddy API running!');
});

// ---------- safe route mounting helper ----------
function mountIfExists(routePath, routerFile) {
  const full = path.join(__dirname, routerFile);
  if (fs.existsSync(full)) {
    try {
      app.use(routePath, require(full));
      console.log(`Mounted ${routePath} from ${routerFile}`);
    } catch (e) {
      console.error(`Failed to mount ${routePath} (${routerFile}):`, e.message);
    }
  } else {
    console.warn(`Skipped ${routePath}: ${routerFile} not found`);
  }
}

// ---------- mount API routes ----------
mountIfExists('/api/log_meal', './api/log_meal');
mountIfExists('/api/log_weight', './api/log_weight');
mountIfExists('/api/log_exercise', './api/log_exercise');
mountIfExists('/api/log_measurements', './api/log_measurements');
mountIfExists('/api/user_goals', './api/user_goals');
mountIfExists('/api/update_user_settings', './api/update_user_settings');
mountIfExists('/api/update_food_value', './api/update_food_value');
mountIfExists('/api/weight_graph', './api/weight_graph');     // optional
mountIfExists('/api/user_profile', './api/user_profile');     // optional
mountIfExists('/api/ping', './api/ping');

// ---------- OpenAPI spec endpoints ----------
/**
 * Basic Auth for human-readable spec
 * Uses env: SPEC_USER / SPEC_PASS
 */
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

// Human/teammate view (passworded)
app.get('/spec/api-spec.yaml', specBasicAuth, (req, res) => {
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

// GPT importer (public; spec contains no secrets; runtime auth is via Bearer JWT)
app.get('/spec/import.yaml', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

// ---------- 404 + error handlers ----------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// ---------- start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy API listening on port ${PORT}`);
});
