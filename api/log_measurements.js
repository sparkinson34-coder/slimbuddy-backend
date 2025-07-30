const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
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
    neck,
    arm,
    under_bust,
    knees,
    ankles,
    notes // ✅ Added notes
  } = req.body;

  if (!user_id || !date) {
    return res.status(400).json({
      error: 'Missing required fields: user_id and date.'
    });
  }

  // ✅ Normalize date format (DD/MM/YYYY → YYYY-MM-DD)
  let normalizedDate = date;
  if (date.includes('/')) {
    const [day, month, year] = date.split('/');
    normalizedDate = `${year}-${month}-${day}`;
  }

  try {
    const { data, error } = await supabase.from('body_measurements').insert([
      {
        user_id,
        date: normalizedDate,
        bust,
        waist,
        hips,
        thighs,
        neck,
        arm,
        under_bust,
        knees,
        ankles,
        notes // ✅ Insert notes
      }
    ]);

    if (error) throw error;

    res.json({ message: 'Measurements logged successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
