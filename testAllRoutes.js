import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// ✅ CONFIGURATION
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; // fallback to local testing
const TOKEN = 'paste_your_test_jwt_token_here'; // 🔐 Replace with test token generated in generateToken.js

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

// ✅ ROUTE TESTS
const tests = [
  {
    name: 'Ping Route',
    method: 'GET',
    url: '/api/ping',
    body: null
  },
  {
    name: 'Log Meal',
    method: 'POST',
    url: '/api/log_meal',
    body: {
      date: '2025-08-07',
      meal_type: 'lunch',
      meal_description: 'Grilled chicken and salad',
      syns: 4,
      healthy_extra_a_used: true,
      healthy_extra_b_used: false,
      notes: 'Tasty and filling'
    }
  },
  {
    name: 'Log Weight',
    method: 'POST',
    url: '/api/log_weight',
    body: {
      date: '2025-08-07',
      weight: 88.2,
      preferred_weight_unit: 'kg',
      notes: 'Weighed after gym'
    }
  },
  {
    name: 'Log Exercise',
    method: 'POST',
    url: '/api/log_exercise',
    body: {
      date: '2025-08-07',
      activity: 'Walking',
      duration_minutes: 60,
      intensity: 'moderate',
      calories_burned: 320,
      notes: 'Morning walk with dog'
    }
  },
  {
    name: 'Log Measurements',
    method: 'POST',
    url: '/api/log_measurements',
    body: {
      date: '2025-08-07',
      waist: 36,
      hips: 44,
      bust: 42,
      thighs: 23
    }
  },
  {
    name: 'User Goals',
    method: 'POST',
    url: '/api/user_goals',
    body: {
      goal_type: 'weight_loss',
      target_value: 5,
      target_date: '2025-09-01'
    }
  },
  {
    name: 'Update User Settings',
    method: 'POST',
    url: '/api/update_user_settings',
    body: {
      preferred_name: 'Sharon',
      tone: 'friendly',
      preferred_weight_unit: 'stone_pounds',
      diet_preference: 'omnivore',
      food_allergies: 'none',
      food_dislikes: 'shellfish, pork',
      typical_day: 'Fruit and yogurt, omelette, chicken salad',
      healthy_extra_a: 'Low-fat cheese triangles',
      healthy_extra_b: 'HEB bar',
      syn_limit: 15,
      target_weight: 65.0
    }
  },
  {
    name: 'Update Food Value',
    method: 'POST',
    url: '/api/update_food_value',
    body: {
      food_name: 'Dark chocolate square',
      syn_value: 1.5
    }
  },
  {
    name: 'User Profile',
    method: 'GET',
    url: '/api/user_profile',
    body: null
  },
  {
    name: 'Weight Graph',
    method: 'GET',
    url: '/api/weight_graph?user_id=test-user-id-1234',
    body: null
  }
];

// ✅ RUN TESTS
const runTests = async () => {
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        headers,
        body: test.body ? JSON.stringify(test.body) : undefined
      });

      const data = await response.json();
      const status = response.ok ? '✅ PASS' : `❌ FAIL (${response.status})`;
      console.log(`\n${status} - ${test.name}`);
      console.log(data);
    } catch (err) {
      console.error(`❌ ERROR - ${test.name}`, err.message);
    }
  }
};

runTests();

// NOTES
// ✅ Uses node-fetch for Windows/PowerShell compatibility
// ✅ Covers all 10 of your current API routes, including user_profile and weight_graph
// ✅ Includes appropriate HTTP methods and test bodies
// ✅ Uses a test JWT token in the Authorization header
// ✅ Outputs clean status logs for each route