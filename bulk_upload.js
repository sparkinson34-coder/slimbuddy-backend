/**
 * ✅ Validate and Normalize Date
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  let normalized = '';
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    normalized = `${year}-${month}-${day}`;
  } else if (dateStr.includes('-')) {
    const [day, month, year] = dateStr.split('-');
    normalized = `${year}-${month}-${day}`;
  }
  // ✅ Validate YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    console.error(`❌ Invalid date after normalization: ${normalized}`);
    return null;
  }
  return normalized;
}

async function uploadWeights(userId) {
  console.log('📤 Uploading weight entries...');
  for (const entry of weightEntries) {
    const weightKg = convertToKg(entry.weight);
    const normalizedDate = normalizeDate(entry.date);

    if (!normalizedDate) {
      console.error(`❌ Skipping entry due to invalid date: ${entry.date}`);
      continue;
    }

    console.log(`➡ Preparing weight entry for ${entry.date} → ${normalizedDate}`);

    const payload = {
      user_id: userId,
      weight: parseFloat(weightKg),
      unit: 'kg',
      date: normalizedDate, // ✅ Always send normalized date
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
