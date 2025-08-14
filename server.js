/**
 * ✅ SlimBuddy Main Server
 * - Express backend serving all API routes
 * - CORS + JSON parsing enabled globally
 * - API routes mounted under /api/*
 * - /spec/api-spec.yaml served with Basic Auth (SPEC_USER / SPEC_PASS)
 * - /api/ping is public for health checks
 * - All other routes require Bearer JWT handled in each route file
 * - Starts server on PORT (Railway sets this automatically)
 * ✅ SlimBuddy Spec Endpoints (Simple Import Flow)
 * - /spec/api-spec.yaml  -> Basic Auth (human viewing)
 * - /spec/import.yaml    -> Public (GPT imports)
 *   The OpenAPI spec has NO secrets; runtime auth is via Bearer JWT.
 */

const path = require('path');

// --- Basic Auth just for the human-readable spec (uses SPEC_USER / SPEC_PASS) ---
function specBasicAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === process.env.SPEC_USER && pass === process.env.SPEC_PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
  return res.status(401).send('Invalid credentials');
}

// Human/teammate route (passworded). Make sure spec/api-spec.yaml exists.
app.get('/spec/api-spec.yaml', specBasicAuth, (req, res) => {
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

// GPT importer route (public, returns YAML directly)
// Rationale: GPT importer is anonymous and expects the actual OpenAPI YAML.
// The spec must not contain secrets; auth happens at runtime via Bearer JWT.
app.get('/spec/import.yaml', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

// --- core middleware ---
app.use(cors());
app.use(express.json());

// --- simple home route (optional) ---
app.get('/', (req, res) => {
  res.send('SlimBuddy API running!');
});

// --- mount API routes (each file exports an Express Router) ---
app.use('/api/log_meal', require('./api/log_meal'));
app.use('/api/log_weight', require('./api/log_weight'));
app.use('/api/log_exercise', require('./api/log_exercise'));
app.use('/api/log_measurements', require('./api/log_measurements'));
app.use('/api/user_goals', require('./api/user_goals'));
app.use('/api/update_user_settings', require('./api/update_user_settings'));
app.use('/api/update_food_value', require('./api/update_food_value'));
app.use('/api/weight_graph', require('./api/weight_graph'));   // optional
app.use('/api/user_profile', require('./api/user_profile'));   // optional
app.use('/api/ping', require('./api/ping'));                   // public

// --- Basic Auth just for the spec (uses SPEC_USER / SPEC_PASS) ---
function specBasicAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === process.env.SPEC_USER && pass === process.env.SPEC_PASS) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="SlimBuddy Spec"');
  return res.status(401).send('Invalid credentials');
}

// --- serve the OpenAPI spec behind basic auth ---
// Human intervention/teammate route (passworded)
// Ensure the file exists at: spec/api-spec.yaml
app.get('/spec/api-spec.yaml', specBasicAuth, (req, res) => {
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

// GPT importer route (public, returns the YAML directly)
// Rationale: GPT needs anonymous access and the spec has no secrets
app.get('/spec/import.yaml', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});

// --- 404 + error handlers ---
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy API listening on port ${PORT}`);
});
