function coordinatePair(value) {
  const match = String(value || "").trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseMapsLink(input) {
  let url;
  try { url = new URL(String(input).trim()); } catch { return null; }
  if (url.protocol !== "https:" || !["maps.google.com", "www.google.com"].includes(url.hostname.toLowerCase())) return null;
  const pairs = ["q", "query", "ll"].map((key) => coordinatePair(url.searchParams.get(key))).filter(Boolean);
  if (!pairs.length) return null;
  const first = pairs[0];
  if (pairs.some((pair) => Math.abs(pair.lat - first.lat) > 1e-6 || Math.abs(pair.lng - first.lng) > 1e-6)) return null;
  const query = encodeURIComponent(`${first.lat},${first.lng}`);
  return { ...first, canonicalUrl: `https://www.google.com/maps/search/?api=1&query=${query}` };
}

module.exports = { parseMapsLink };
