/**
 * ✅ log_weight.js
 * Handles POST requests to log weight for authenticated users.
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const secureRoute = require('../lib/authMiddleware');

// ✅ Initialize Supabase Client with Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Route to log weight
router.post('/', secureRoute, async (req, res) => {
  try {
    const { user_id, weight, date, unit, notes } = req.body;

    // ✅ Validate fields
    if (!user_id || !weight || !unit || !date) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, weight, unit, date',
      });
    }

    // ✅ Normalize date
    let normalizedDate = date;
    if (date.includes('/')) {
      const [day, month, year] = date.split('/');
      normalizedDate = `${year}-${month}-${day}`;
    }

    // ✅ Convert weight to KG if needed
    let weightInKg = weight;
    if (unit === 'lbs') {
      weightInKg = weight * 0.453592;
    }

    // ✅ Insert into Supabase
    const { data, error } = await supabase.from('weight_logs').insert([
      {
        user_id,
        weight: weightInKg,
        unit: 'kg',
        date: normalizedDate,
        notes: notes || '',
      },
    ]);

    if (error) throw error;
    res.json({ message: '✅ Weight logged successfully!', data });
  } catch (err) {
    console.error('❌ Error in log_weight:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

