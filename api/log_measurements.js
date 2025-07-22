const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

// 🔒 REMOVE THIS LINE BEFORE GOING LIVE — SECURITY DISABLED FOR TESTING ONLY
router.post('/', async (req, res) => {

// 🔒Enable this command to enable security when we go live by deleting everything before the: router.post('/', secureRoute, async (req, res) => {

  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body.' });
  }

  const {
    user_id,
    date,
    bust,
    waist,
    hips,
    thighs,
    notes
  } = req.body;
  if (!user_id || !date) {
    return res.status(400).json({
      error: 'Missing required fields. Please include user_id and date.'
    });
  }



  const { data, error } = await supabase.from('body_measurements').insert([
    {
      user_id,
      date,
      bust,
      waist,
      hips,
      thighs,
      notes
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Measurements logged successfully', data });
});

module.exports = router;
