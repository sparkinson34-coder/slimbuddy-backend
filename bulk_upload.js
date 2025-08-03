// ✅ Load environment variables
require('dotenv').config();
const axios = require('axios');

const API_BASE = 'https://slimbuddy-backend-production.up.railway.app/api';
const AUTH_TOKEN = process.env.USER_JWT_TOKEN;

const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

let detectedUserId = null; // ✅ This will store the correct user_id from SlimBuddy DB

// ✅ 1. Fetch User Profile to Auto-Detect user_id
async function getUserProfile() {
  console.log('🔍 Fetching user profile using JWT...');
  try {
    const response = await axios.get(`${API_BASE}/user_profile`, { headers: HEADERS });
    detectedUserId = response.data.user_id;
    console.log(`✅ User ID detected: ${detectedUserId}`);
  } catch (err) {
    console.error('❌ Failed to fetch user profile:', err.response?.data || err.message);
    process.exit(1); // Stop script if user_id not found
  }
}

// ✅ 2. Convert Stones & Pounds → kg
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

// ✅ 3. Convert inches → cm
function inchesToCm(value) {
  return value ? (parseFloat(value) * 2.54).toFixed(1) : null;
}

// ✅ 4. Bulk Weights (Add as many as you like)
const weightEntries = [
  { date: "04-09-2024", weight: "17 st 4.5 lbs", notes: "1/2 Stone Award" },
  { date: "11-09-2024", weight: "17 st 0 lbs", notes: "" },
  { date: "18-09-2024", weight: "16 st 11.5 lbs", notes: "1 Stone Award" }
  // ... rest of your data
];

// ✅ 5. Bulk Measurements
const measurementEntries = [
  { date:"30/10/2024", bust: 46, waist: 39.5, hips: 50, neck: 15.5, arm: 15, under_bust: 38.5, thighs: 45.5, knee: 18.5, ankles: 11, notes: "Great inch loss!" }
  // ... rest of your data
];

// ✅ 6. Upload Weights
async function uploadWeights() {
  console.log('📤 Uploading weight entries...');
  for (const entry of weightEntries) {
    const weightKg = convertToKg(entry.weight);
    const normalizedDate = entry.date.split('-').reverse().join('-');
    const payload = {
      user_id: detectedUserId, // ✅ Now uses auto-detected ID
      weight: parseFloat(weightKg),
      unit: 'kg',
      date: normalizedDate,
      notes: entry.notes
    };

    try {
      await axios.post(`${API_BASE}/log_weight`, payload, { headers: HEADERS });
      console.log(`✅ Logged weight: ${entry.weight} (${weightKg} kg) on ${entry.date}`);
    } catch (err) {
      console.error(`❌ Failed for ${entry.date}:`, err.response?.data || err.message);
    }
  }
}

// ✅ 7. Upload Measurements
async function uploadMeasurements() {
  console.log('\n📤 Uploading measurement entries...');
  for (const entry of measurementEntries) {
    const normalizedDate = entry.date.replace(/\//g, '-').split('-').reverse().join('-');
    const payload = {
      user_id: detectedUserId,
      bust: inchesToCm(entry.bust),
      waist: inchesToCm(entry.waist),
      hips: inchesToCm(entry.hips),
      neck: inchesToCm(entry.neck),
      arm: inchesToCm(entry.arm),
      under_bust: inchesToCm(entry.under_bust),
      thighs: inchesToCm(entry.thighs),
      knee: inchesToCm(entry.knee),
      ankles: inchesToCm(entry.ankles),
      notes: entry.notes,
      date: normalizedDate
    };

    try {
      await axios.post(`${API_BASE}/log_measurements`, payload, { headers: HEADERS });
      console.log(`✅ Logged measurements for ${entry.date}`);
    } catch (err) {
      console.error(`❌ Failed for ${entry.date}:`, err.response?.data || err.message);
    }
  }
}

// ✅ 8. Main Execution
(async () => {
  await getUserProfile(); // Fetch user_id dynamically
  await uploadWeights();
  await uploadMeasurements();
  console.log('\n🎉 All bulk uploads complete!');
})();
