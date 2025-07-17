require('dotenv').config();

const supabase = require('./lib/supabaseClient');

async function testSelect() {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Data from users table:', data);
  }
}

testSelect();
