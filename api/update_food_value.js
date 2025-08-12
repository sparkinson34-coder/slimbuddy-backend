const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');

router.post('/', secureRoute, async (req, res) => {
  const { food_name, syn_value, notes, date } = req.body;

  if (!food_name || syn_value == null) {
    return res.status(400).json({ error: 'Missing required fields: food_name and syn_value' });
  }

  // Use today's date if none provided
  const entryDate = date || new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('syn_values')
    .insert({
      user_id: req.user.id,
      food_name,
      syn_value,
      notes: notes || null,
      date: entryDate
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Syn value logged successfully' });
});

module.exports = router;