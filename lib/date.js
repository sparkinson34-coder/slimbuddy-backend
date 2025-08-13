// lib/date.js
/**
 * Normalizes dates to YYYY-MM-DD.
 * Accepts:
 * - "YYYY-MM-DD" -> returned as-is
 * - "DD/MM/YYYY" or "DD-MM-YYYY" -> converted to "YYYY-MM-DD"
 */
function normalizeDate(input) {
  if (!input) return null;
  const s = String(input).trim().replace(/\//g, '-');
  const parts = s.split('-');
  // already YYYY-MM-DD
  if (parts.length === 3 && parts[0].length === 4) return s;
  // assume DD-MM-YYYY
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  // last resort: try Date parse but still output YYYY-MM-DD
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

module.exports = { normalizeDate };
