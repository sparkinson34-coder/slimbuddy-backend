/**
 * ✅ SlimBuddy End-to-End Route Tester
 * - Runs through all API routes with realistic payloads (insert + fetch)
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
 * Usage (PowerShell):
 *   $env:BASE_URL="https://slimbuddy-backend-production.up.railway.app"
 *   $env:TOKEN="PASTE_YOUR_JWT"
 *   node testAllRoutes.js
 *
 * Notes:
 * - Reads BASE_URL and TOKEN from environment variables.
 * - Uses today's date for inserts; tweak the dates below if you prefer.
 * - Prints compact PASS/FAIL + response JSON for each step.
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TOKEN || 'PASTE_YOUR_JWT';

// ---------- Helpers ----------
const authHeaders = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
const jsonHeaders = { 'Content-Type': 'application/json' };

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

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

// Optional: small delay between calls
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Tests ----------
async function run() {
  const today = isoToday();

  // 1) Ping (public)
  try {
    const res = await axios.get(`${BASE_URL}/api/ping`);
    logResult('Ping', res);
  } catch (err) {
    logError('Ping', err);
  }

  // 2) Log Meal (POST)
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
    const res = await axios.post(`${BASE_URL}/api/log_meal`, body, {
      headers: { ...jsonHeaders, ...authHeaders },
    });
    logResult('Log Meal', res);
  } catch (err) {
    logError('Log Meal', err);
  }

  await wait(200);

  // 3) Log Weight (POST) — kg example
  try {
    const body = {
      date: today,
      unit: 'kg',
      weight: 82.4,
      notes: 'Post-workout weigh-in'
    };
    const res = await axios.post(`${BASE_URL}/api/log_weight`, body, {
      headers: { ...jsonHeaders, ...authHeaders },
    });
    logResult('Log Weight (kg)', res);
  } catch (err) {
    logError('Log Weight (kg)', err);
  }

  await wait(200);

  // 4) Log Exercise (POST)
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
    const res = await axios.post(`${BASE_URL}/api/log_exercise`, body, {
      headers: { ...jsonHeaders, ...authHeaders },
    });
    logResult('Log Exercise', res);
  } catch (err) {
    logError('Log Exercise', err);
  }

  await wait(200);

  // 5) Log Measurements (POST)
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
    const res = await axios.post(`${BASE_URL}/api/log_measurements`, body, {
      headers: { ...jsonHeaders, ...authHeaders },
    });
    logResult('Log Measurements', res);
  } catch (err) {
    logError('Log Measurements', err);
  }

  await wait(200);

  // 6) User Goals (POST) — st_lbs example (12st 7lb)
  try {
    const body = {
      goal_type: 'weight_loss',
      unit: 'st_lbs',
      stones: 12,
      pounds: 7,
      target_date: today
    };
    const res = await axios.post(`${BASE_URL}/api/user_goals`, body, {
      headers: { ...jsonHeaders, ...authHeaders },
    });
    logResult('User Goals (st_lbs)', res);
  } catch (err) {
    logError('User Goals (st_lbs)', err);
  }

  await wait(200);

  // 7) Update User Settings (PATCH)
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
    const res = await axios.patch(`${BASE_URL}/api/update_user_settings`, body, {
      headers: { ...jsonHeaders, ...authHeaders },
    });
    logResult('Update User Settings (PATCH)', res);
  } catch (err) {
    logError('Update User Settings (PATCH)', err);
  }

  await wait(200);

  // 8) Update Food Value (POST)
  try {
    const body = {
      food_name: 'Weetabix Minis - Chocolate',
      syn_value: 6,
      is_healthy_extra_b: false,
      notes: 'Corrected from 4 to 6 Syns',
      date: today
    };
    const res = await axios.post(`${BASE_URL}/api/update_food_value`, body, {
      headers: { ...jsonHeaders, ...authHeaders },
    });
    logResult('Update Food Value', res);
  } catch (err) {
    logError('Update Food Value', err);
  }

  await wait(200);

  // 9) Weight Graph (GET) — optional range (last 30 days)
  try {
    const start = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = today;
    const res = await axios.get(`${BASE_URL}/api/weight_graph`, {
      headers: { ...authHeaders },
      params: { start, end }
    });
    logResult('Weight Graph (GET)', res);
  } catch (err) {
    logError('Weight Graph (GET)', err);
  }

  await wait(200);

  // 10) (Optional) User Profile (GET) — helper route
  try {
    const res = await axios.get(`${BASE_URL}/api/user_profile`, {
      headers: { ...authHeaders },
    });
    logResult('User Profile (GET)', res);
  } catch (err) {
    logError('User Profile (GET)', err);
  }

  console.log('\n🎉 Test run completed.\n');
}

run().catch((e) => {
  console.error('Unexpected runner error:', e);
});
