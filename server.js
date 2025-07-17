require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Example default route
app.get('/', (req, res) => {
  res.send('SlimBuddy API running!');
});

// Import all your routes here
app.use('/api/log_meal', require('./api/log_meal'));
app.use('/api/log_weight', require('./api/log_weight'));
app.use('/api/log_exercise', require('./api/log_exercise'));
app.use('/api/log_measurements', require('./api/log_measurements'));
app.use('/api/user_goals', require('./api/user_goals'));
app.use('/api/update_user_settings', require('./api/update_user_settings'));
app.use('/api/update_food_value', require('./api/update_food_value'));
app.use('/api/ping', require('./api/ping'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy API listening on port ${PORT}`);
});