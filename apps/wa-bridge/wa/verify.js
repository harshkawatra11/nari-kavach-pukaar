// Vendored from harshkawatra11/whatsapp-blaster alongside desktop.win.js.
// It verifies that the expected alert text reached WhatsApp's composer
// before the bridge presses Enter.

function normaliseLineEndings(s) {
  return String(s).replace(/\r\n?/g, "\n").trim();
}

function similarity(a, b) {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  let matches = minLen - maxLen;
  for (let i = 0; i < minLen; i++) if (a[i] === b[i]) matches++;
  return Math.max(0, matches) / maxLen;
}

const VERIFY_SIMILARITY_THRESHOLD = 0.95;

module.exports = { normaliseLineEndings, similarity, VERIFY_SIMILARITY_THRESHOLD };
