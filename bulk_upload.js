/**
 * ✅ SlimBuddy Bulk Upload
 * - Auth: reads JWT from env (TOKEN preferred; falls back to USER_JWT_TOKEN)
 * - Normalizes dates to YYYY-MM-DD
 * - Converts stones+lbs / lbs → kg
 * - Converts inches → cm for measurements
 * - Uses server-side JWT (no user_id in payload)
 * - Prints clear progress + errors
 *
 * Usage (PowerShell):
 *   $env:BASE_URL="https://slimbuddy-backend-production.up.railway.app"
 *   $env:TOKEN="PASTE_YOUR_JWT"
 *   node bulk_upload.js
 */

require('dotenv').config();
const axios = require('axios');

// --- config ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TOKEN || process.env.USER_JWT_TOKEN;

if (!BASE_URL) {
  console.error('❌ BASE_URL is missing. Set BASE_URL env var.');
  process.exit(1);
}
if (!TOKEN) {
  console.error('❌ TOKEN is missing. Set TOKEN env var (or USER_JWT_TOKEN).');
  process.exit(1);
}

const API = `${BASE_URL.replace(/\/$/, '')}/api`;
const HEADERS = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// --- helpers ---
function normalizeDate(input) {
  if (!input) return null;
  const clean = String(input).trim().replace(/\//g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    // dd-mm-yyyy → yyyy-mm-dd
    if (parts[0].length !== 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return clean; // already yyyy-mm-dd
  }
  return clean;
}

function toKg(weightStr) {
  if (weightStr == null) return null;
  const s = String(weightStr).toLowerCase().trim();

  // Match "12 st 7" or "12st 7lb/7lbs"
  const stMatch = s.match(/(\d+(?:\.\d+)?)\s*st(?:one)?s?\s*(\d+(?:\.\d+)?)?\s*(lb|lbs)?/);
  if (stMatch) {
    const stones = parseFloat(stMatch[1]) || 0;
    const pounds = parseFloat(stMatch[2]) || 0;
    const totalLbs = stones * 14 + pounds;
    return +(totalLbs * 0.45359237).toFixed(2);
  }

  // Match "200 lb"/"200 lbs"
  const lbMatch = s.match(/(\d+(?:\.\d+)?)\s*(lb|lbs)\b/);
  if (lbMatch) {
    return +(parseFloat(lbMatch[1]) * 0.45359237).toFixed(2);
  }

  // Assume kg if it looks numeric
  const kg = parseFloat(s);
  return isNaN(kg) ? null : +kg.toFixed(2);
}

function inchesToCm(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return +((n * 2.54).toFixed(1));
}

// --- sample data (edit as needed) ---
const weightEntries = [
  { date: '04-09-2024', weight: '17 st 4.5 lbs', notes: '1/2 Stone Award' },
  { date: '11-09-2024', weight: '17 st 0 lb', notes: '' },
  { date: '18-09-2024', weight: '16 st 11.5 lbs', notes: '1 Stone Award' },
  { date: '25-09-2024', weight: '16 st 7.5 lbs', notes: '' },
  { date: '02-10-2024', weight: '16 st 6 lb', notes: '' },
];

const measurementEntries = [
  { date: '30/10/2024', bust: 46, waist: 39.5, hips: 50, neck: 15.5, arm: 15, under_bust: 38.5, thighs: 45.5, knees: 18.5, ankles: 11, notes: 'Great inch loss this time!' },
  { date: '10/01/2025', bust: 44, waist: 35, hips: 47, neck: 14.5, arm: 14.5, under_bust: 36.5, thighs: 44, knees: 18.5, ankles: 11, notes: 'Bought new bras this week!' },
];

// --- optional: confirm token/user works ---
async function checkProfile() {
  try {
    const res = await axios.get(`${API}/user_profile`, { headers: HEADERS });
    if (res.data?.user_id) {
      console.log(`🔐 Auth OK. user_id: ${res.data.user_id}`);
    } else {
      console.warn('⚠️ user_profile returned no user_id (route optional). Proceeding anyway.');
    }
  } catch (e) {
    console.warn('⚠️ Could not call /user_profile (optional). Proceeding.');
  }
}

// --- uploads ---
async function uploadWeights() {
  console.log('\n📤 Uploading weight entries...');
  for (const entry of weightEntries) {
    const date = normalizeDate(entry.date);
    const kg = toKg(entry.weight);
    if (!date || kg == null) {
      console.error(`❌ Skipping invalid weight entry:`, entry);
      continue;
    }

    const payload = { date, unit: 'kg', weight: kg, notes: entry.notes || '' };

    try {
      await axios.post(`${API}/log_weight`, payload, { headers: HEADERS });
      console.log(`✅ Weight ${entry.weight} → ${kg} kg on ${date}`);
    } catch (err) {
      console.error(`❌ log_weight ${date}:`, err.response?.data || err.message);
    }
  }
}

async function uploadMeasurements() {
  console.log('\n📤 Uploading measurement entries...');
  for (const m of measurementEntries) {
    const date = normalizeDate(m.date);
    if (!date) {
      console.error(`❌ Skipping invalid measurement date:`, m.date);
      continue;
    }
    const payload = {
      date,
      bust: inchesToCm(m.bust),
      waist: inchesToCm(m.waist),
      hips: inchesToCm(m.hips),
      neck: inchesToCm(m.neck),
      arm: inchesToCm(m.arm),
      under_bust: inchesToCm(m.under_bust),
      thighs: inchesToCm(m.thighs),
      knees: inchesToCm(m.knees),
      ankles: inchesToCm(m.ankles),
      notes: m.notes || '',
    };

    try {
      await axios.post(`${API}/log_measurements`, payload, { headers: HEADERS });
      console.log(`✅ Measurements saved for ${date}`);
    } catch (err) {
      console.error(`❌ log_measurements ${date}:`, err.response?.data || err.message);
    }
  }
}

// --- runner ---
(async () => {
  console.log(`🔍 BASE_URL: ${BASE_URL}`);
  await checkProfile();
  await uploadWeights();
  await uploadMeasurements();
  console.log('\n🎉 Bulk upload complete.');
})();
