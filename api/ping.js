const express = require('express');
const router = express.Router();

// Responds to GET requests like:
// curl.exe http://localhost:3000/api/ping
router.get('/', (req, res) => {
  res.send('OK');
});

// Responds to POST requests like:
// curl.exe -X POST http://localhost:3000/api/ping
router.post('/', (req, res) => {
  res.json({ message: 'ping endpoint working!' });
});

module.exports = router;