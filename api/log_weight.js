const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

// This line is just for testing purposes and should be deleted and the following line enabled when we go live. 
router.post('/', async (req, res) => {

// This needs to be enabled when we go live so delete everything before the: router.post('/', secureRoute, async (req, res) => {

  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body.' });
  }

  const {
    user_id,
    weight,
    unit,
    date,
    notes
  } = req.body;

  if (!user_id || typeof weight !== 'number' || !unit || !date) {
    return res.status(400).json({
      error: 'Missing required fields. Please include user_id, weight, unit, and date.'
    });
  }

  const { data, error } = await supabase.from('weight_logs').insert([
    {
      user_id,
      weight,
      unit,
      date,
      notes
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Weight logged successfully', data });
});

module.exports = router;