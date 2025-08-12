// --- simple basic auth middleware just for the spec ---
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

// --- serve the OpenAPI spec behind basic auth ---
// If your file is spec/api-spec.yaml, use this path & URL:
app.get('/spec/api-spec.yaml', specBasicAuth, (req, res) => {
  res.type('text/yaml'); // optional nicety
  res.sendFile(path.join(__dirname, 'spec', 'api-spec.yaml'));
});
