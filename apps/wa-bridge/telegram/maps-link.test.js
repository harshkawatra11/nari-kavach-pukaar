const test = require("node:test");
const assert = require("node:assert/strict");
const { parseMapsLink } = require("./maps-link.js");

test("parses and canonicalizes Telegram's copied Maps link", () => {
  assert.deepEqual(parseMapsLink("https://maps.google.com/maps?q=28.713800,77.207110&ll=28.713800,77.207110&z=16"), {
    lat: 28.7138,
    lng: 77.20711,
    canonicalUrl: "https://www.google.com/maps/search/?api=1&query=28.7138%2C77.20711",
  });
});

test("rejects conflicting coordinates", () => {
  assert.equal(parseMapsLink("https://maps.google.com/maps?q=28.7,77.2&ll=29,78"), null);
});

test("rejects unsafe hosts", () => {
  assert.equal(parseMapsLink("https://example.com/?q=28.7,77.2"), null);
});
