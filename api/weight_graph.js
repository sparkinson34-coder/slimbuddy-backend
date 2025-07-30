const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');
const secureRoute = require('../lib/authMiddleware');
const QuickChart = require('quickchart-js');

router.get('/', secureRoute, async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  const { data, error } = await supabase
    .from('weights')
    .select('date, weight')
    .eq('user_id', user_id)
    .order('date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const labels = data.map(d => d.date);
  const values = data.map(d => d.weight);

  const chart = new QuickChart();
  chart.setConfig({
    type: 'line',
    data: { labels, datasets: [{ label: 'Weight (kg)', data: values, fill: false, borderColor: 'blue' }] },
    options: { scales: { y: { beginAtZero: false } } }
  });

  res.json({ chartUrl: chart.getUrl() });
});

module.exports = router;