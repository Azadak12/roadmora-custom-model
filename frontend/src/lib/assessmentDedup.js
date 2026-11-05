// Canonicalize answers so checkbox order and surrounding whitespace do not
// turn an unchanged assessment into a new submission.
export async function assessmentFingerprint(data) {
  const canonical = Object.fromEntries(Object.keys(data).sort().map(key => {
    const value = data[key];
    return [key, Array.isArray(value)
      ? [...new Set(value.map(item => String(item).trim()))].sort()
      : typeof value === 'string' ? value.trim() : value];
  }));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical)));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export function uniqueCareerResults(results) {
  const careers = new Map();
  results.forEach((result, index) => {
    const key = result.career_field?.trim().replace(/\s+/g, ' ').toLowerCase() || `unknown-${index}`;
    const existing = careers.get(key);
    if (!existing || (Date.parse(result.created_at) || 0) > (Date.parse(existing.result.created_at) || 0)) {
      careers.set(key, { result, index });
    }
  });
  return [...careers.values()];
}
