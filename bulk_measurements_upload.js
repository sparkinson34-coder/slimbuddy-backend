require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.SUPABASE_URL;
const TOKEN = process.env.JWT_TOKEN;
const USER_ID = '7cb49eea-a5b1-42a4-bb50-0ca8442c5fc0';

// ✅ Bulk Measurements Data (Full set)
// ✅ Field Headers Date, Bust, Waist, Hips, Neck, Arm, Under_Bust, Thighs, Knees, Ankles, Notes
const measurements = [
  "30/10/2024, 46 in, 39.5 in, 50 in, 15.5 in, 15 in, 38.5 in, 45.5 in, 18.5 in, 11 in",
  "10/01/2025, 44 in, 35 in, 47 in, 14.5 in, 14.5 in, 36.5 in, 44 in, 18.5 in, 11 in",
  "25/04/2025, 42 in, 35 in, 46 in, 14.5 in, 14 in, 36 in, 43.5 in, 18 in, 10.5 in",	 
  "05/07/2025, 41 in, 33 in, 44 in, 14 in, 13 in, 35 in, 41 in, 17.5 in, 10.5 in"
// Add more rows here
];

// ✅ Convert date format: DD-MM-YYYY → YYYY-MM-DD
function normalizeDate(dateStr) {
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
}

// ✅ Convert inches → cm if needed
function toCm(value) {
  if (!value || value.trim() === '') return null;
  if (value.toLowerCase().includes('cm')) {
    return parseFloat(value);
  } else if (value.toLowerCase().includes('in')) {
    return (parseFloat(value) * 2.54).toFixed(1);
  } else {
    return parseFloat(value);
  }
}

async function uploadMeasurements() {
  for (const entry of measurements) {
    try {
      const [date, bust, waist, hips, neck, arm, underBust, thighs, knees, ankles] = entry.split(',');
      const normalizedDate = normalizeDate(date.trim());

      const payload = {
        user_id: USER_ID,
        date: normalizedDate,
        bust: toCm(bust),
        waist: toCm(waist),
        hips: toCm(hips),
        neck: toCm(neck),
        arm: toCm(arm),
        under_bust: toCm(underBust),
        thighs: toCm(thighs),
        knees: toCm(knees),
        ankles: toCm(ankles)
      };

      console.log(`Uploading measurements for ${normalizedDate}:`, payload);

      await axios.post(`${API_BASE_URL}/api/log_measurements`, payload, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Uploaded: ${normalizedDate}`);
    } catch (error) {
      console.error(`❌ Error uploading ${entry}:`, error.response ? error.response.data : error.message);
    }
  }
}

uploadMeasurements();