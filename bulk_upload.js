/**
 * ✅ Bulk Upload Script for SlimBuddy
 * Features:
 * - Auto-detect user_id from JWT
 * - Normalize all dates to YYYY-MM-DD
 * - Convert weight & measurements to correct units
 * - Log successes and detailed errors
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'https://slimbuddy-backend-production.up.railway.app/api';
const AUTH_TOKEN = process.env.USER_JWT_TOKEN;

const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

/**
 * ✅ 1. Detect User ID from JWT
 */
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
 * ✅ 2. Convert Stones & Pounds → kg
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
 * ✅ 3. Convert inches → cm
 */
function inchesToCm(value) {
  return value && !isNaN(value) ? parseFloat(value * 2.54).toFixed(1) : null;
}

/**
 * ✅ 4. Normalize date → YYYY-MM-DD
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  if (dateStr.includes('-')) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }
  return dateStr; // Assume already normalized
}

// ✅ Bulk weight entries
const weightEntries = [
  { date: '04-09-2024', weight: '17 st 4.5 lbs', notes: '1/2 Stone Award' },
  { date: '11-09-2024', weight: '17 st 0 lbs', notes: '' },
  { date: '18-09-2024', weight: '16 st 11.5 lbs', notes: '1 Stone Award' },
  { date: '25-09-2024', weight: '16 st 7.5 lbs', notes: '' },
  { date: '02-10-2024', weight: '16 st 6 lbs', notes: '' },
];

// ✅ Bulk measurement entries
const measurementEntries = [
  { date: '30/10/2024', bust: 46, waist: 39.5, hips: 50, neck: 15.5, arm: 15, under_bust: 38.5, thighs: 45.5, knees: 18.5, ankles: 11, notes: 'Great inch loss this time!' },
  { date: '10/01/2025', bust: 44, waist: 35, hips: 47, neck: 14.5, arm: 14.5, under_bust: 36.5, thighs: 44, knees: 18.5, ankles: 11, notes: 'Bought new bras this week!' },
];

/**
 * ✅ 5. Upload weights
 */
async function uploadWeights(userId) {
  console.log('📤 Uploading weight entries...');
  for (const entry of weightEntries) {
    const weightKg = convertToKg(entry.weight);
    const normalizedDate = normalizeDate(entry.date);
    console.log(`➡ Preparing weight entry for ${entry.date} → ${normalizedDate}`);

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

/**
 * ✅ 6. Upload measurements
 */
async function uploadMeasurements(userId) {
  console.log('\n📤 Uploading measurement entries...');
  for (const entry of measurementEntries) {
    const normalizedDate = normalizeDate(entry.date);
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

// ✅ 7. Main
(async () => {
  const detectedUserId = await getUserId();
  await uploadWeights(detectedUserId);
  await uploadMeasurements(detectedUserId);
  console.log('\n🎉 All bulk uploads complete!');
})();
