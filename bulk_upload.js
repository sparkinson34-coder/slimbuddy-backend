/**
 * ✅ Bulk Upload Script for SlimBuddy
 * Features:
 * - Auto-detect user_id from JWT token
 * - Upload weights with proper date format
 * - Upload measurements with safe defaults
 * - Improved error handling
 */

require('dotenv').config();
const axios = require('axios');

// ✅ API Config
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
 * ✅ 2. Convert date to YYYY-MM-DD for Postgres
 */
function formatDate(dateStr) {
  if (dateStr.includes('-')) {
    const [day, month, year] = dateStr.split('-'); // e.g., "18-09-2024"
    return `${year}-${month}-${day}`; // ✅ 2024-09-18
  }
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/'); // e.g., "30/10/2024"
    return `${year}-${month}-${day}`; // ✅ 2024-10-30
  }
  return dateStr;
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
 * ✅ 4. Convert inches → cm
 */
function inchesToCm(value) {
  return value && !isNaN(value) ? parseFloat(value * 2.54).toFixed(1) : 0;
}

// ✅ 5. Bulk Weights Array
const weightEntries = [
  { date: "04-09-2024", weight: "17 st 4.5 lbs", notes: "1/2 Stone Award" },
  { date: "11-09-2024", weight: "17 st 0 lbs", notes: "" },
  { date: "18-09-2024", weight: "16 st 11.5 lbs", notes: "1 Stone Award" },
  { date: "25-09-2024", weight: "16 st 7.5 lbs", notes: "" },
  { date: "02-10-2024", weight: "16 st 6 lbs", notes: "" },
  // ✅ Add more entries as needed
];

// ✅ 6. Bulk Measurements Array
const measurementEntries = [
  { date: "30/10/2024", bust: 46, waist: 39.5, hips: 50, neck: 15.5, arm: 15, under_bust: 38.5, thighs: 45.5, knee: 18.5, ankles: 11, notes: "Great inch loss this time!" },
  { date: "10/01/2025", bust: 44, waist: 35, hips: 47, neck: 14.5, arm: 14.5, under_bust: 36.5, thighs: 44, knee: 18.5, ankles: 11, notes: "Bought new bras this week!" },
];

/**
 * ✅ 7. Upload Weights
 */
async function uploadWeights(userId) {
  console.log('📤 Uploading weight entries...');
  for (const entry of weightEntries) {
    const weightKg = convertToKg(entry.weight);
    const normalizedDate = formatDate(entry.date);

    const payload = {
      user_id: userId,
      weight: parseFloat(weightKg),
      unit: 'kg',
      date: normalizedDate,
      notes: entry.notes || '',
    };

    try {
      await axios.post(`${API_BASE}/log_weight`, payload, { headers: HEADERS });
      console.log(`✅ Logged weight: ${entry.weight} (${weightKg} kg) on ${entry.date}`);
    } catch (err) {
      console.error(`❌ Failed for ${entry.date}:`, err.response?.data || err.message);
    }
  }
}

/**
 * ✅ 8. Upload Measurements
 */
async function uploadMeasurements(userId) {
  console.log('\n📤 Uploading measurement entries...');
  for (const entry of measurementEntries) {
    const normalizedDate = formatDate(entry.date);

    const payload = {
      user_id: userId,
      bust: inchesToCm(entry.bust),
      waist: inchesToCm(entry.waist),
      hips: inchesToCm(entry.hips),
      neck: inchesToCm(entry.neck),
      arm: inchesToCm(entry.arm),
      under_bust: inchesToCm(entry.under_bust),
      thighs: inchesToCm(entry.thighs),
      knee: inchesToCm(entry.knee),
      ankles: inchesToCm(entry.ankles),
      notes: entry.notes || '',
      date: normalizedDate,
    };

    try {
      await axios.post(`${API_BASE}/log_measurements`, payload, { headers: HEADERS });
      console.log(`✅ Logged measurements for ${entry.date}`);
    } catch (err) {
      console.error(`❌ Failed for ${entry.date}:`, err.response?.data || err.message || 'Unknown error');
    }
  }
}

/**
 * ✅ 9. Main Function
 */
(async () => {
  const detectedUserId = await getUserId();
  await uploadWeights(detectedUserId);
  await uploadMeasurements(detectedUserId);
  console.log('\n🎉 All bulk uploads complete!');
})();
