/**
 * ✅ Weight Logging API
 * - Normalizes date
 * - Uses user_id from JWT, not request body
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const secureRoute = require('../lib/authMiddleware');

// ✅ Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Normalize date (DD-MM-YYYY → YYYY-MM-DD)
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/\//g, '-');
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
}

router.post('/', secureRoute, async (req, res) => {
  try {
    const { weight, date, unit, notes } = req.body;
    const user_id = req.user.sub || req.user.id;

    if (!weight || !date || !unit) {
      return res.status(400).json({ error: 'Missing required fields: weight, date, unit' });
    }

    const normalizedDate = normalizeDate(date);
    const weightInKg = parseFloat(weight); // Conversion should already happen client-side

    console.log('🛠 Insert Payload:', { user_id, normalizedDate, weightInKg });

    const { data, error } = await supabase.from('weight_logs').insert([{
      user_id,
      weight: weightInKg,
      unit: 'kg',
      date: normalizedDate,
      notes: notes || ''
    }]);

    if (error) throw error;

    res.json({ message: '✅ Weight logged successfully', data });
  } catch (err) {
    console.error('❌ Weight Log Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
