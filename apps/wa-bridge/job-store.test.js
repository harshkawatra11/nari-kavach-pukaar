const test = require("node:test");
const assert = require("node:assert/strict");
const { createJobStore } = require("./job-store.js");

test("queued jobs preserve recipients for the worker", () => {
  const store = createJobStore();
  const contacts = [{ name: "Test", phone: "918595856713" }];
  const first = store.create({ alertId: "alert-123", contacts, message: "test", returnDelayMs: 0 });
  assert.deepEqual(first.job.contacts, contacts);
});

test("duplicate IDs return the original job", () => {
  const store = createJobStore();
  const input = { alertId: "alert-123", contacts: [{ name: "Test", phone: "918595856713" }], message: "test", returnDelayMs: 0 };
  assert.equal(store.create(input).created, true);
  assert.equal(store.create(input).created, false);
});
