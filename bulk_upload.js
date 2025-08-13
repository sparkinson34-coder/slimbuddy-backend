/**
 * ✅ SlimBuddy Bulk Upload (2025-08)
 * Uploads weights, measurements, meals, and exercises to your live backend.
 *
 * - Reads BASE_URL and TOKEN from environment variables
 * - Converts dates to YYYY-MM-DD
 * - Converts stones+lbs / lbs -> kg (weights)
 * - Converts inches -> cm (measurements) if needed
 * - Uses server routes:
 *   POST /api/log_weight
 *   POST /api/log_measurements
 *   POST /api/log_meal
 *   POST /api/log_exercise
 *
 * PowerShell (example):
 *   $env:BASE_URL="https://slimbuddy-backend-production.up.railway.app"
 *   $env:TOKEN="PASTE_YOUR_JWT"
 *   node bulk_upload.js
 */
/**
 * ✅ SlimBuddy Bulk Upload (CommonJS + axios)
 * - Uses env: BASE_URL, TOKEN  (JWT)
 * - Normalizes dates to YYYY-MM-DD
 * - Converts stones+lbs / lbs -> kg
 * - Optional CSVs in /data:
 *    bulk_weights.csv        date,weight,unit,notes
 *    bulk_measurements.csv   date,bust,waist,hips,neck,arm,under_bust,thighs,knees,ankles,notes
 *    bulk_meals.csv          date,meal_description,syns,calories,notes
 *    bulk_exercises.csv      date,activity,duration_minutes,intensity,calories_burned,steps,distance_km,notes
 *
 * PowerShell:
 *   $env:BASE_URL="https://slimbuddy-backend-production.up.railway.app"
 *   $env:TOKEN="PASTE_YOUR_JWT"
 *   # optional: $env:CONVERT_MEAS_INCHES="1"
 *   node bulk_upload.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error('❌ TOKEN missing. Set $env:TOKEN (PowerShell) or export TOKEN (bash).');
  process.exit(1);
}
const API = `${BASE_URL}/api`;
const HEADERS = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// ---------- helpers ----------
function normalizeDate(input) {
  if (!input) return null;
  const s = String(input).trim().replace(/\//g, '-');
  const p = s.split('-');
  if (p.length === 3 && p[0].length === 4) return s;        // YYYY-MM-DD
  if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;      // DD-MM-YYYY -> YYYY-MM-DD
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
const isoToday = () => new Date().toISOString().slice(0, 10);

function toKg(weightStr) {
  if (weightStr == null) return null;
  const s = String(weightStr).toLowerCase().trim();

  // "12 st 7" / "12st 7lb" / "12 stone 7.5 lbs"
  const st = s.match(/(\d+(?:\.\d+)?)\s*st(?:one)?s?\s*(\d+(?:\.\d+)?)?\s*(lb|lbs)?/);
  if (st) {
    const stones = parseFloat(st[1]) || 0;
    const pounds = parseFloat(st[2]) || 0;
    return +(((stones * 14) + pounds) * 0.45359237).toFixed(2);
  }

  // "200 lb"/"200 lbs"
  const lb = s.match(/(\d+(?:\.\d+)?)\s*(lb|lbs)\b/);
  if (lb) return +(parseFloat(lb[1]) * 0.45359237).toFixed(2);

  // numeric kg
  const kg = parseFloat(s);
  return Number.isFinite(kg) ? +kg.toFixed(2) : null;
}
const cleanNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
function inchesToCm(val) {
  const n = Number(val);
  return Number.isFinite(n) ? +((n * 2.54).toFixed(1)) : null;
}
function tryReadCsv(csvPath) {
  try {
    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    if (!raw) return [];
    const [headerLine, ...lines] = raw.split(/\r?\n/);
    const headers = headerLine.split(',').map(h => h.trim());
    return lines
      .filter(Boolean)
      .map(line => {
        const cols = line.split(',').map(c => c.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
        return obj;
      });
  } catch {
    return [];
  }
}

// ---------- inline data (edit/append) ----------
// 👇 your sample entry — correctly inside the array
const inlineWeights = [
  { date: "04-09-2024", weight: "17 st 4.5 lbs", notes: "1/2 Stone Award" },
];

const inlineMeasurements = [
  // { date: '13/08/2025', bust: 92, waist: 75, hips: 98, neck: 34, arm: 29, under_bust: 80, thighs: 58, knees: 36, ankles: 23, notes: '' },
];

const inlineMeals = [
  // { date: '13/08/2025', meal_description: 'Chicken stir fry', syns: 3.5, calories: 420, notes: '1 tbsp soy sauce' },
];

const inlineExercises = [
  // { date: '13/08/2025', activity: 'Walking', duration_minutes: 45, intensity: 'Moderate', calories_burned: 300, steps: 7500, distance_km: 5.2, notes: 'Morning walk' },
];

// ---------- CSV (optional) ----------
const weightsFromCsv    = tryReadCsv(path.join(__dirname, 'data', 'bulk_weights.csv'));
const measuresFromCsv   = tryReadCsv(path.join(__dirname, 'data', 'bulk_measurements.csv'));
const mealsFromCsv      = tryReadCsv(path.join(__dirname, 'data', 'bulk_meals.csv'));
const exercisesFromCsv  = tryReadCsv(path.join(__dirname, 'data', 'bulk_exercises.csv'));

const csvWeights = weightsFromCsv.map(r => ({
  date: r.date, weight: r.weight, unit: r.unit || '', notes: r.notes || ''
}));
const csvMeasurements = measuresFromCsv.map(r => ({
  date: r.date, bust: r.bust, waist: r.waist, hips: r.hips, neck: r.neck, arm: r.arm,
  under_bust: r.under_bust, thighs: r.thighs, knees: r.knees, ankles: r.ankles, notes: r.notes || ''
}));
const csvMeals = mealsFromCsv.map(r => ({
  date: r.date, meal_description: r.meal_description, syns: r.syns, calories: r.calories, notes: r.notes || ''
}));
const csvExercises = exercisesFromCsv.map(r => ({
  date: r.date, activity: r.activity, duration_minutes: r.duration_minutes, intensity: r.intensity,
  calories_burned: r.calories_burned, steps: r.steps, distance_km: r.distance_km, notes: r.notes || ''
}));

// ---------- queues ----------
const weights      = [...inlineWeights, ...csvWeights];
const measurements = [...inlineMeasurements, ...csvMeasurements];
const meals        = [...inlineMeals, ...csvMeals];
const exercises    = [...inlineExercises, ...csvExercises];

// ---------- optional sanity check ----------
async function checkProfile() {
  try {
    const res = await axios.get(`${API}/user_profile`, { headers: HEADERS });
    if (res.data?.user_id) console.log(`🔐 Auth OK. user_id: ${res.data.user_id}`);
  } catch {
    console.log('ℹ️ /api/user_profile not available (optional). Continuing.');
  }
}

// ---------- uploaders ----------
async function uploadWeights() {
  if (!weights.length) { console.log('\n⏭️  No weight entries.'); return; }
  console.log('\n📤 Uploading weight entries...');
  for (const w of weights) {
    const date = normalizeDate(w.date) || isoToday();
    const kg = toKg(w.weight);
    if (!date || kg == null) {
      console.error('❌ Skipping invalid weight entry:', w);
      continue;
    }
    const body = { date, unit: 'kg', weight: kg, notes: w.notes || '' };
    try {
      await axios.post(`${API}/log_weight`, body, { headers: HEADERS });
      console.log(`✅ Weight ${w.weight} → ${kg} kg on ${date}`);
    } catch (err) {
      console.error(`❌ log_weight ${date}:`, err.response?.data || err.message);
    }
  }
}

function cmOrInchesToCm(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return process.env.CONVERT_MEAS_INCHES === '1' ? inchesToCm(n) : n;
}

async function uploadMeasurements() {
  if (!measurements.length) { console.log('\n⏭️  No measurement entries.'); return; }
  console.log('\n📤 Uploading measurement entries...');
  for (const m of measurements) {
    const date = normalizeDate(m.date) || isoToday();
    if (!date) { console.error('❌ Invalid measurement date:', m.date); continue; }
    const body = {
      date,
      bust: cmOrInchesToCm(m.bust),
      waist: cmOrInchesToCm(m.waist),
      hips: cmOrInchesToCm(m.hips),
      neck: cmOrInchesToCm(m.neck),
      arm: cmOrInchesToCm(m.arm),
      under_bust: cmOrInchesToCm(m.under_bust),
      thighs: cmOrInchesToCm(m.thighs),
      knees: cmOrInchesToCm(m.knees),
      ankles: cmOrInchesToCm(m.ankles),
      notes: m.notes || ''
    };
    try {
      await axios.post(`${API}/log_measurements`, body, { headers: HEADERS });
      console.log(`✅ Measurements for ${date}`);
    } catch (err) {
      console.error(`❌ log_measurements ${date}:`, err.response?.data || err.message);
    }
  }
}

async function uploadMeals() {
  if (!meals.length) { console.log('\n⏭️  No meal entries.'); return; }
  console.log('\n📤 Uploading meal entries...');
  for (const ml of meals) {
    const date = normalizeDate(ml.date) || isoToday();
    if (!date) { console.error('❌ Invalid meal date:', ml.date); continue; }
    if (!ml.meal_description) { console.error('❌ Missing meal_description:', ml); continue; }
    if (ml.syns == null || Number.isNaN(Number(ml.syns))) { console.error('❌ Missing/invalid syns:', ml); continue; }
    const body = {
      date,
      meal_description: ml.meal_description,
      syns: Number(ml.syns),
      notes: ml.notes || ''
    };
    if (ml.calories != null && !Number.isNaN(Number(ml.calories))) {
      body.calories = Number(ml.calories);
    }
    try {
      await axios.post(`${API}/log_meal`, body, { headers: HEADERS });
      console.log(`✅ Meal "${ml.meal_description}" on ${date}`);
    } catch (err) {
      console.error(`❌ log_meal ${date}:`, err.response?.data || err.message);
    }
  }
}

async function uploadExercises() {
  if (!exercises.length) { console.log('\n⏭️  No exercise entries.'); return; }
  console.log('\n📤 Uploading exercise entries...');
  for (const ex of exercises) {
    const date = normalizeDate(ex.date) || isoToday();
    if (!date) { console.error('❌ Invalid exercise date:', ex.date); continue; }
    if (!ex.activity) { console.error('❌ Missing activity:', ex); continue; }
    const body = {
      date,
      activity: ex.activity,
      duration_minutes: cleanNum(ex.duration_minutes),
      intensity: ex.intensity || null,
      calories_burned: cleanNum(ex.calories_burned),
      steps: cleanNum(ex.steps),
      distance_km: cleanNum(ex.distance_km),
      notes: ex.notes || ''
    };
    try {
      await axios.post(`${API}/log_exercise`, body, { headers: HEADERS });
      console.log(`✅ Exercise "${ex.activity}" on ${date}`);
    } catch (err) {
      console.error(`❌ log_exercise ${date}:`, err.response?.data || err.message);
    }
  }
}

// ---------- run ----------
(async () => {
  console.log(`🔍 BASE_URL: ${BASE_URL}`);
  try {
    const res = await axios.get(`${API}/user_profile`, { headers: HEADERS });
    if (res.data?.user_id) console.log(`🔐 Auth OK. user_id: ${res.data.user_id}`);
  } catch {
    console.log('ℹ️ /api/user_profile not available (optional). Continuing.');
  }

  await uploadWeights();
  await uploadMeasurements();
  await uploadMeals();
  await uploadExercises();

  console.log('\n🎉 Bulk upload complete.');
})();
