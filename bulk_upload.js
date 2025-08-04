/**
 * ✅ Bulk Upload Script for SlimBuddy
 * - Auto-detect user_id from JWT token
 * - Upload weight and measurement logs
 * - Converts Stones & Pounds → kg
 * - Converts inches → cm
 * - Handles invalid dates gracefully
 */

require('dotenv').config();
const axios = require('axios');

// ✅ API and Auth Config
const API_BASE = 'https://slimbuddy-backend-production.up.railway.app/api';
const AUTH_TOKEN = process.env.USER_JWT_TOKEN;

const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

// ✅ 1. Detect User ID from /user_profile API
async function getUserId() {
  console.log('🔍 Fetching user profile using JWT...');
  try {
    const response = await axios.get(`${API_BASE}/user_profile`, { headers: HEADERS });
    if (response.data && response.data.user_id) {
      console.log(`✅ Detected User ID: ${response.data.user_id}`);
      return response.data.user_id;
    }
    throw new Error('User ID not found in response');
  } catch (err) {
    console.error('❌ Failed to fetch user profile:', err.response?.data || err.message);
    process.exit(1);
  }
}

/**
 * ✅ 2. Date Normalizer (DD-MM-YYYY or DD/MM/YYYY → YYYY-MM-DD)
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.replace(/\//g, '-'); // Replace slashes with hyphens
  const parts = clean.split('-');
  if (parts.length === 3) {
    let [dd, mm, yyyy] = parts;
    // Handle if input is YYYY-MM-DD already
    if (yyyy.length === 4) {
      return `${yyyy}-${mm}-${dd}`;
    }
    // Handle DD-MM-YYYY
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

/**
 * ✅ 3. Convert Stones & Pounds → kg
 */
function convertToKg(weightStr) {
  weightStr = weightStr.toLowerCase();
  if (weightStr.includes('st')) {
    const match = weightStr.match(/(\d+)\s*st\s*(\d+\.?\d*)?/);
    if (match) {
      const stones = parseInt(match[1]);
      const pounds = parseFloat(match[2]) || 0;
      return (stones * 6.35029 + pounds * 0.453592).toFixed(2);
    }
  }
  if (weightStr.includes('lbs')) {
    const lbs = parseFloat(weightStr);
    return (lbs * 0.453592).toFixed(2);
  }
  return parseFloat(weightStr); // Assume already in kg
}

/**
 * ✅ 4. Convert Inches → cm
 */
function inchesToCm(value) {
  return value && !isNaN(value) ? parseFloat(value * 2.54).toFixed(1) : null;
}

// ✅ Bulk Weights Array
const weightEntries = [
  { date: "04-09-2024", weight: "17 st 4.5 lbs", notes: "1/2 Stone Award" },
  { date: "11-09-2024", weight: "17 st 0 lbs", notes: "" },
  { date: "18-09-2024", weight: "16 st 11.5 lbs", notes: "1 Stone Award" },
  { date: "25-09-2024", weight: "16 st 7.5 lbs", notes: "" },
  { date: "02-10-2024", weight: "16 st 6 lbs", notes: "" },
];

// ✅ Bulk Measurements Array
const measurementEntries = [
  { date: "30/10/2024", bust: 46, waist: 39.5, hips: 50, neck: 15.5, arm: 15, under_bust: 38.5, thighs: 45.5, knees: 18.5, ankles: 11, notes: "Great inch loss this time!" },
  { date: "10/01/2025", bust: 44, waist: 35, hips: 47, neck: 14.5, arm: 14.5, under_bust: 36.5, thighs: 44, knees: 18.5, ankles: 11, notes: "Bought new bras this week!" },
];

// ✅ Upload Weights
async function uploadWeights(userId) {
  console.log('📤 Uploading weight entries...');
  for (const entry of weightEntries) {
    const normalizedDate = normalizeDate(entry.date);
    if (!normalizedDate) {
      console.warn(`⚠️ Skipping invalid date: ${entry.date}`);
      continue;
    }

    console.log(`➡ Preparing weight entry for ${entry.date} → ${normalizedDate}`);
    const weightKg = convertToKg(entry.weight);

    const payload = {
      user_id: userId,
      weight: parseFloat(weightKg),
      unit: 'kg',
      date: normalizedDate,
      notes: entry.notes || '',
    };

    try {
      await axios.post(`${API_BASE}/log_weight`, payload, { headers: HEADERS });
      console.log(`✅ Logged weight: ${entry.weight} (${weightKg} kg) on ${normalizedDate}`);
    } catch (err) {
      console.error(`❌ Failed for ${entry.date}:`, err.response?.data || err.message);
    }
  }
}

// ✅ Upload Measurements
async function uploadMeasurements(userId) {
  console.log('\n📤 Uploading measurement entries...');
  for (const entry of measurementEntries) {
    const normalizedDate = normalizeDate(entry.date);
    if (!normalizedDate) {
      console.warn(`⚠️ Skipping invalid date: ${entry.date}`);
      continue;
    }

    console.log(`➡ Preparing measurement entry for ${entry.date} → ${normalizedDate}`);
    const payload = {
      user_id: userId,
      bust: inchesToCm(entry.bust),
      waist: inchesToCm(entry.waist),
      hips: inchesToCm(entry.hips),
      neck: inchesToCm(entry.neck),
      arm: inchesToCm(entry.arm),
      under_bust: inchesToCm(entry.under_bust),
      thighs: inchesToCm(entry.thighs),
      knees: inchesToCm(entry.knees),
      ankles: inchesToCm(entry.ankles),
      notes: entry.notes || '',
      date: normalizedDate,
    };

    try {
      await axios.post(`${API_BASE}/log_measurements`, payload, { headers: HEADERS });
      console.log(`✅ Logged measurements for ${normalizedDate}`);
    } catch (err) {
      console.error(`❌ Failed for ${entry.date}:`, err.response?.data || err.message);
    }
  }
}

// ✅ Main Runner
(async () => {
  const detectedUserId = await getUserId();
  await uploadWeights(detectedUserId);
  await uploadMeasurements(detectedUserId);
  console.log('\n🎉 All bulk uploads complete!');
})();
