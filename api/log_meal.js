const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

// 🔒 REMOVE THIS LINE BEFORE GOING LIVE — SECURITY DISABLED FOR TESTING ONLY
router.post('/', async (req, res) => {

// 🔒Enable this command to enable security when we go live by deleting everything before the: router.post('/', secureRoute, async (req, res) => {

  // ✅ Check that a body was sent
  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body' });
  }

  // ✅ Proceed to destructure safely
  const {
    user_id,
    meal_description,
    syns,
    meal_type,
    healthy_extra_a_used,
    healthy_extra_b_used,
    notes,
    date
  } = req.body;

  // ✅ Check required fields (optional but good practice)
  if (!user_id || !meal_description || typeof syns !== 'number') {
    return res.status(400).json({
      error: 'Missing required fields. Please include user_id, meal_description, and syns.'
    });
  }

  const { data, error } = await supabase.from('meal_logs').insert([
    {
      user_id,
      meal_description,
      syns,
      meal_type,
      healthy_extra_a_used,
      healthy_extra_b_used,
      notes,
      date
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Meal logged successfully', data });
});

module.exports = router;
