require('dotenv').config();

const supabase = require('./lib/supabaseClient');
async function insertSynValue() {
  const { data, error } = await supabase
    .from('syn_values')
    .insert([
      {
        food_name: 'Alpen Light Bar - Chocolate Fudge',
        syn_value: 3,
        is_healthy_extra_b: true
      }
    ]);

  if (error) {
    console.error(error);
  } else {
    console.log('Inserted syn value:', data);
  }
}

insertSynValue();

