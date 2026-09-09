const test = require("node:test");
const assert = require("node:assert/strict");
const { createDispatchWorker } = require("./dispatch-worker.js");

function adapter(overrides = {}) {
  return { getClipboard: async () => "before", setClipboard: async () => {}, isRunning: async () => true, focus: async () => {}, resetToCleanState: async () => {}, openChatByNumber: async () => {}, pasteIntoComposer: async () => {}, verifyComposer: async () => ({ ok: true, score: 1 }), clearComposer: async () => {}, pressEnterToSend: async () => {}, ...overrides };
}

test("clipboard failure terminates without locking", async () => {
  const stages = [];
  const worker = createDispatchWorker({ wa: adapter({ getClipboard: async () => { throw new Error("clipboard"); } }), captureForegroundTarget: async () => null, restoreForegroundTarget: async () => true, sleep: async () => {} });
  await worker.run({ contacts: [{ name: "Test", phone: "918595856713" }], message: "test", returnDelayMs: 0 }, (patch) => stages.push(patch.stage));
  assert.deepEqual(stages, ["preparing", "failed"]);
});

test("composer mismatch prevents Enter", async () => {
  let enterCount = 0;
  const stages = [];
  const worker = createDispatchWorker({ wa: adapter({ verifyComposer: async () => ({ ok: false, score: 0.2 }), pressEnterToSend: async () => { enterCount += 1; } }), captureForegroundTarget: async () => null, restoreForegroundTarget: async () => true, sleep: async () => {} });
  await worker.run({ contacts: [{ name: "Test", phone: "918595856713" }], message: "test", returnDelayMs: 0 }, (patch) => stages.push(patch.stage));
  assert.equal(enterCount, 0);
  assert.equal(stages.at(-1), "failed");
});

test("restores foreground after verified submission", async () => {
  let restored = false;
  const snapshots = [];
  const worker = createDispatchWorker({ wa: adapter(), captureForegroundTarget: async () => ({ handle: "1" }), restoreForegroundTarget: async () => { restored = true; return true; }, sleep: async () => {} });
  await worker.run({ contacts: [{ name: "Test", phone: "918595856713" }], message: "test", returnDelayMs: 0 }, (patch) => snapshots.push(patch));
  assert.equal(restored, true);
  assert.equal(snapshots.at(-1).stage, "submitted");
});
