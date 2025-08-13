/**
 * ✅ SlimBuddy End-to-End Route Tester
 * - Runs through all API routes with realistic payloads (insert + fetch)
 * - Sends YYYY-MM-DD dates for every route
 * - Uses env: BASE_URL and TOKEN 
 * - Uses today's date for inserts; tweak the dates below if you prefer.
 * - Prints compact PASS/FAIL + response JSON for each step.
 * - Matches latest schemas & methods:
 *   - /api/log_meal (POST)
 *   - /api/log_weight (POST, unit conversion)
 *   - /api/log_exercise (POST)
 *   - /api/log_measurements (POST)
 *   - /api/user_goals (POST, kg/lbs/st_lbs)
 *   - /api/update_user_settings (PATCH)
 *   - /api/update_food_value (POST)
 *   - /api/weight_graph (GET, optional date range)
 *   - /api/user_profile (GET, optional helper)
 *   - /api/ping (GET, public)
 *
 * To test, in PowerShell, run):
 *   $env:BASE_URL="https://slimbuddy-backend-production.up.railway.app"
 *   $env:TOKEN="PASTE_YOUR_JWT_GIVEN_ONCE_LOGGED_IN"
 *   node testAllRoutes.js
 *
 * Notes:
 * - Uses today's date for inserts; tweak the dates below if you prefer.
 * - Prints compact PASS/FAIL + response JSON for each step.
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('❌ TOKEN missing. Set $env:TOKEN (PowerShell) or export TOKEN (bash).');
  process.exit(1);
}

const authHeaders = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

function isoToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
const today = isoToday();

function logResult(name, res) {
  const ok = res && res.status >= 200 && res.status < 300;
  console.log(`\n${ok ? '✅ PASS' : `❌ FAIL (${res?.status || 'no response'})`} - ${name}`);
  if (res?.data) console.dir(res.data, { depth: null });
}
function logError(name, err) {
  const status = err.response?.status;
  console.log(`\n❌ ERROR - ${name} ${status ? `(HTTP ${status})` : ''}`);
  if (err.response?.data) console.dir(err.response.data, { depth: null });
  else console.error(err.message);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1) Ping (public)
  try {
    const res = await axios.get(`${BASE_URL}/api/ping`);
    logResult('Ping', res);
  } catch (e) { logError('Ping', e); }

  // 2) Log Meal
  try {
    const body = {
      date: today,
      meal_type: 'lunch',
      meal_description: 'Chicken stir fry with soy sauce',
      syns: 3.5,
      healthy_extra_a_used: false,
      healthy_extra_b_used: true,
      calories: 420,
      notes: 'Used 1 tbsp soy sauce'
    };
    const res = await axios.post(`${BASE_URL}/api/log_meal`, body, { headers: authHeaders });
    logResult('Log Meal', res);
  } catch (e) { logError('Log Meal', e); }

  await wait(150);

  // 3) Log Weight (kg)
  try {
    const body = {
      date: today,
      unit: 'kg',
      weight: 82.4,
      notes: 'Post-workout weigh-in'
    };
    const res = await axios.post(`${BASE_URL}/api/log_weight`, body, { headers: authHeaders });
    logResult('Log Weight (kg)', res);
  } catch (e) { logError('Log Weight (kg)', e); }

  await wait(150);

  // 4) Log Exercise
  try {
    const body = {
      date: today,
      activity: 'Walking',
      duration_minutes: 45,
      intensity: 'Moderate',
      calories_burned: 300,
      steps: 7500,
      distance_km: 5.2,
      notes: 'Morning walk in the park'
    };
    const res = await axios.post(`${BASE_URL}/api/log_exercise`, body, { headers: authHeaders });
    logResult('Log Exercise', res);
  } catch (e) { logError('Log Exercise', e); }

  await wait(150);

  // 5) Log Measurements
  try {
    const body = {
      date: today,
      bust: 92,
      waist: 75,
      hips: 98,
      neck: 34,
      arm: 29,
      under_bust: 80,
      thighs: 58,
      knees: 36,
      ankles: 23,
      notes: 'Evening readings'
    };
    const res = await axios.post(`${BASE_URL}/api/log_measurements`, body, { headers: authHeaders });
    logResult('Log Measurements', res);
  } catch (e) { logError('Log Measurements', e); }

  await wait(150);

  // 6) User Goals (st_lbs example)
  try {
    const body = {
      goal_type: 'weight_loss',
      unit: 'st_lbs',
      stones: 12,
      pounds: 7,
      target_date: today
    };
    const res = await axios.post(`${BASE_URL}/api/user_goals`, body, { headers: authHeaders });
    logResult('User Goals (st_lbs)', res);
  } catch (e) { logError('User Goals (st_lbs)', e); }

  await wait(150);

  // 7) Update User Settings (PATCH upsert)
  try {
    const body = {
      preferred_name: 'Sharon',
      tone: 'friendly',
      preferred_weight_unit: 'st_lbs',
      diet_preference: 'omnivore',
      food_allergies: 'none',
      food_dislikes: 'shellfish',
      typical_day: 'Desk job, lunchtime walk',
      healthy_extra_a: 'Low fat cheese',
      healthy_extra_b: 'Oats',
      syn_limit: 15,
      target_weight: 65,
      maintenance_mode_enabled: false
    };
    const res = await axios.patch(`${BASE_URL}/api/update_user_settings`, body, { headers: authHeaders });
    logResult('Update User Settings (PATCH)', res);
  } catch (e) { logError('Update User Settings (PATCH)', e); }

  await wait(150);

  // 8) Update Food Value
  try {
    const body = {
      food_name: 'Weetabix Minis - Chocolate',
      syns: 6,
      notes: 'Corrected from 4 to 6 Syns',
      date: today
    };
    const res = await axios.post(`${BASE_URL}/api/update_food_value`, body, { headers: authHeaders });
    logResult('Update Food Value', res);
  } catch (e) { logError('Update Food Value', e); }

  await wait(150);

  // 9) Weight Graph (GET last 30 days)
  try {
    const res = await axios.get(`${BASE_URL}/api/weight_graph`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { /* optional start/end; defaults handled server-side */ }
    });
    logResult('Weight Graph (GET)', res);
  } catch (e) { logError('Weight Graph (GET)', e); }

  await wait(150);

  // 10) User Profile (GET) (optional helper)
  try {
    const res = await axios.get(`${BASE_URL}/api/user_profile`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    logResult('User Profile (GET)', res);
  } catch (e) { logError('User Profile (GET)', e); }

  console.log('\n🎉 Test run completed.\n');
})();