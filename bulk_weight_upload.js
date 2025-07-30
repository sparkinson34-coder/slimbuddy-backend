require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'https://slimbuddy-backend-production.up.railway.app/api/log_weight';
const USER_ID = process.env.USER_ID;
const JWT_TOKEN = process.env.JWT_TOKEN;

// ✅ Input weight data here
// ✅ Field Names - Date, Weight (in stones & pounds)
const weightEntries = [
{ date: "04-09-2024", weight: "17 st 4.5 lbs" notes: "1/2 Stone Award" }
  { date: "11-09-2024", weight: "17 st 0 lbs" notes: " " }
  { date: "18-09-2024", weight: "16 st 11.5 lbs" notes: "1 Stone Award" }
  { date: "25-09-2024", weight: "16 st 7.5 lbs" notes: " " }
  { date: "02-10-2024", weight: "16 st 6 lbs" notes: " " }
  { date: "18-10-2024", weight: "16 st 1.5 lbs" notes: "1 1/2 Stone Award" }
  { date: "24-10-2024", weight: "16 st 0 lbs" notes: " " }
  { date: "30-10-2024", weight: "15 st 12 lbs" notes: "2 Stone Award" }
  { date: "06-11-2024", weight: "15 st 11.5 lbs" notes: " " }
  { date: "22-11-2024", weight: "15 st 5 lbs" notes: "2 1/2 Stone Award" }
  { date: "27-11-2024", weight: "15 st 5 lbs" notes: " " }
  { date: "04-12-2024", weight: "15 st 3 lbs" notes: " " }
  { date: "13-12-2024", weight: "15 st 2 lbs" notes: " " }
  { date: "18-12-2024", weight: "15 st 2 lbs" notes: " " }
  { date: "24-12-2024", weight: "14 st 13 lbs" notes: " " }
  { date: "31-12-2024", weight: "14 st 13 lbs" notes: " " }
  { date: "07-01-2025", weight: "14 st 11 lbs" notes: "3 Stone Award" }
  { date: "14-01-2025", weight: "14 st 10.5 lbs" notes: " " }
  { date: "21-01-2025", weight: "14 st 10 lbs" notes: " " }
  { date: "28-01-2025", weight: "14 st 8.5 lbs" notes: " " }
  { date: "04-02-2025", weight: "14 st 7.5 lbs" notes: " " }
  { date: "14-02-2025", weight: "14 st 6 lbs" notes: " " }
  { date: "19-02-2025", weight: "14 st 6.5 lbs" notes: " " }
  { date: "25-02-2025", weight: "14 st 3.5 lbs" notes: "3 1/2 Stone Award" }
  { date: "05-03-2025", weight: "14 st 3.5 lbs" notes: " " }
  { date: "12-03-2025", weight: "14 st 4 lbs" notes: " " }
  { date: "21-03-2025", weight: "14 st 1 lbs" notes: " " }
  { date: "09-04-2025", weight: "13 st 13 lbs" notes: " " }
  { date: "18-04-2025", weight: "13 st 12 lbs" notes: "4 Stone Award" }
  { date: "25-04-2025", weight: "13 st 12 lbs" notes: " " }
  { date: "02-05-2025", weight: "13 st 11.5 lbs" notes: " " }
  { date: "09-05-2025", weight: "13 st 11.5 lbs" notes: " " }
  { date: "16-05-2025", weight: "13 st 10 lbs" notes: " " }
  { date: "23-05-2025", weight: "13 st 9.5 lbs" notes: " " }
  { date: "30-05-2025", weight: "13 st 9 lbs" notes: " " }
  { date: "07-06-2025", weight: "13 st 8 lbs" notes: " " }
  { date: "14-06-2025", weight: "13 st 9.5 lbs" notes: " " }
  { date: "21-06-2025", weight: "13 st 5.5 lbs" notes: "4 1/2 Stone Award" }
  { date: "28-06-2025", weight: "13 st 4.5 lbs" notes: " " }
  { date: "05-07-2025", weight: "13 st 2.5 lbs" notes: " " }
  { date: "12-07-2025", weight: "13 st 1 lbs" notes: " " }
  { date: "19-07-2025", weight: "13 st 0 lbs" notes: " " }
  { date: "26-07-2025", weight: "12 st 11.5 lbs" notes: "4 1/2 Stone Award" }
];

function convertDate(dateStr) {
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
}

function convertWeightToKg(weightStr) {
  weightStr = weightStr.toLowerCase();
  if (weightStr.includes('st')) {
    const match = weightStr.match(/(\d+)\s*st(?:one)?\s*(\d*\.?\d*)?/);
    if (match) {
      const stones = parseFloat(match[1]);
      const pounds = match[2] ? parseFloat(match[2]) : 0;
      return (stones * 6.35029) + (pounds * 0.453592);
    }
  } else if (weightStr.includes('lbs')) {
    const lbs = parseFloat(weightStr.replace(/[^\d.]/g, ''));
    return lbs * 0.453592;
  } else {
    return parseFloat(weightStr); // assume already in kg
  }
}

async function uploadWeights() {
  for (const entry of weightEntries) {
    const date = convertDate(entry.date);
    const weightKg = convertWeightToKg(entry.weight);

    const payload = {
      user_id: USER_ID,
      weight: weightKg,
      unit: "kg",
      date: date,
      notes: entry.notes || ""
    };

    try {
      const res = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      });
      console.log(`✅ Logged weight for ${date}: ${weightKg.toFixed(2)} kg`);
    } catch (err) {
      console.error(`❌ Error uploading ${date}:`, err.response ? err.response.data : err.message);
    }
  }
}

uploadWeights();