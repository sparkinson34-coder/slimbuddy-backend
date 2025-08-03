require('dotenv').config();
const axios = require('axios');

const API_BASE = 'https://slimbuddy-backend-production.up.railway.app/api';
const USER_ID = process.env.USER_ID;
const AUTH_TOKEN = process.env.USER_JWT_TOKEN;

const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

// ✅ Convert Stones & Pounds → kg
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

// ✅ Convert inches → cm
function inchesToCm(value) {
  return value ? (parseFloat(value) * 2.54).toFixed(1) : null;
}

// ✅ Bulk Weights
const weightEntries = [
  { date: "04-09-2024", weight: "17 st 4.5 lbs", notes: "1/2 Stone Award" },
  { date: "11-09-2024", weight: "17 st 0 lbs", notes: " " },
  { date: "18-09-2024", weight: "16 st 11.5 lbs", notes: "1 Stone Award" },
  { date: "25-09-2024", weight: "16 st 7.5 lbs", notes: " " },
  { date: "02-10-2024", weight: "16 st 6 lbs", notes: " " },
  { date: "18-10-2024", weight: "16 st 1.5 lbs", notes: "1 1/2 Stone Award" },
  { date: "24-10-2024", weight: "16 st 0 lbs", notes: " " },
  { date: "30-10-2024", weight: "15 st 12 lbs", notes: "2 Stone Award" },
  { date: "06-11-2024", weight: "15 st 11.5 lbs", notes: " " },
  { date: "22-11-2024", weight: "15 st 5 lbs", notes: "2 1/2 Stone Award" },
  { date: "27-11-2024", weight: "15 st 5 lbs", notes: " " },
  { date: "04-12-2024", weight: "15 st 3 lbs", notes: " " },
  { date: "13-12-2024", weight: "15 st 2 lbs", notes: " " },
  { date: "18-12-2024", weight: "15 st 2 lbs", notes: " " },
  { date: "24-12-2024", weight: "14 st 13 lbs", notes: " " },
  { date: "31-12-2024", weight: "14 st 13 lbs", notes: " " },
  { date: "07-01-2025", weight: "14 st 11 lbs", notes: "3 Stone Award" },
  { date: "14-01-2025", weight: "14 st 10.5 lbs", notes: " " },
  { date: "21-01-2025", weight: "14 st 10 lbs", notes: " " },
  { date: "28-01-2025", weight: "14 st 8.5 lbs", notes: " " },
  { date: "04-02-2025", weight: "14 st 7.5 lbs", notes: " " },
  { date: "14-02-2025", weight: "14 st 6 lbs", notes: " " },
  { date: "19-02-2025", weight: "14 st 6.5 lbs", notes: " " },
  { date: "25-02-2025", weight: "14 st 3.5 lbs", notes: "3 1/2 Stone Award" },
  { date: "05-03-2025", weight: "14 st 3.5 lbs", notes: " " },
  { date: "12-03-2025", weight: "14 st 4 lbs", notes: " " },
  { date: "21-03-2025", weight: "14 st 1 lbs", notes: " " },
  { date: "09-04-2025", weight: "13 st 13 lbs", notes: " " },
  { date: "18-04-2025", weight: "13 st 12 lbs", notes: "4 Stone Award" },
  { date: "25-04-2025", weight: "13 st 12 lbs", notes: " " },
  { date: "02-05-2025", weight: "13 st 11.5 lbs", notes: " " },
  { date: "09-05-2025", weight: "13 st 11.5 lbs", notes: " " },
  { date: "16-05-2025", weight: "13 st 10 lbs", notes: " " },
  { date: "23-05-2025", weight: "13 st 9.5 lbs", notes: " " },
  { date: "30-05-2025", weight: "13 st 9 lbs", notes: " " },
  { date: "07-06-2025", weight: "13 st 8 lbs", notes: " " },
  { date: "14-06-2025", weight: "13 st 9.5 lbs", notes: " " },
  { date: "21-06-2025", weight: "13 st 5.5 lbs", notes: "4 1/2 Stone Award" },
  { date: "28-06-2025", weight: "13 st 4.5 lbs", notes: " " },
  { date: "05-07-2025", weight: "13 st 2.5 lbs", notes: " " },
  { date: "12-07-2025", weight: "13 st 1 lbs", notes: " " },
  { date: "19-07-2025", weight: "13 st 0 lbs", notes: " " },
  { date: "26-07-2025", weight: "12 st 11.5 lbs", notes: "5 Stone Award" }
];

// ✅ Bulk Measurements
const measurementEntries = [
  { date:"30/10/2024", bust: 46, waist: 39.5, hips: 50, neck: 15.5, arm: 15, under_bust: 38.5, thighs: 45.5, knee: 18.5, ankles: 11, notes: "Great inch loss this time!" },
  { date:"10/01/2025", bust: 44, waist: 35, hips: 47, neck: 14.5, arm: 14.5, under_bust: 36.5, thighs: 44, knee: 18.5, ankles: 11, notes: "Bought new bras this week!" },
  { date:"25/04/2025", bust: 42, waist: 35, hips: 46, neck: 14.5, arm: 14, under_bust: 36, thighs: 43.5, knee: 18, ankles: 10.5, notes: "Got in to Size 14 Jeans!" },
  { date:"05/07/2025", bust: 41, waist: 33, hips: 44, neck: 14, arm: 13, under_bust: 35, thighs: 41, knee: 17.5, ankles: 10.5, notes: "Had to take Size 14 jeans & shorts in at the waist" },
];

async function uploadWeights() {
  console.log('📤 Uploading weight entries...');
  for (const entry of weightEntries) {
    const weightKg = convertToKg(entry.weight);
    const normalizedDate = entry.date.split('-').reverse().join('-');
    const payload = {
      user_id: process.env.USER_ID,  // ✅ Make sure this matches Supabase
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

async function uploadMeasurements() {
  console.log('\n📤 Uploading measurement entries...');
  for (const entry of measurementEntries) {
    const normalizedDate = entry.date.replace(/\//g, '-').split('-').reverse().join('-');
    const payload = {
      user_id: USER_ID,
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

(async () => {
  await uploadWeights();
  await uploadMeasurements();
  console.log('\n🎉 All bulk uploads complete!');
})();
