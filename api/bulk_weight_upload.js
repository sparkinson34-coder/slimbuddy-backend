require('dotenv').config();
const fetch = require('node-fetch');

const BASE_URL = 'https://slimbuddy-backend-production.up.railway.app/api/log_weight';
const TOKEN = 'YOUR_JWT_TOKEN'; // Replace or inject dynamically
const USER_ID = '7cb49eea-a5b1-42a4-bb50-0ca8442c5fc0';

// Example data
const weights = [
  { date: '2024-09-04', stones: 17, pounds: 4.5 },
  { date: '2024-09-11', stones: 17, pounds: 0 },
  { date: '2024-09-18', stones: 16, pounds: 11.5 }
];

async function logWeights() {
  for (const entry of weights) {
    const weightKg = (entry.stones * 6.35029) + (entry.pounds * 0.453592);
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: USER_ID,
        weight: parseFloat(weightKg.toFixed(2)),
        date: entry.date,
        unit: 'kg'
      })
    });
    const data = await response.json();
    console.log(`Logged ${entry.date}:`, data);
  }
}

logWeights();