const test = require("node:test");
const assert = require("node:assert/strict");
const { createTelegramCaptureWorker } = require("./capture-worker.js");

function harness(overrides = {}) {
  const calls = [];
  const adapter = {
    isRunning: async () => true,
    focus: async () => calls.push("focus"),
    openSavedMessages: async () => calls.push("openSavedMessages"),
    verifySavedMessages: async () => true,
    openLocationPicker: async () => calls.push("openLocationPicker"),
    waitForHumanSubmission: async () => calls.push("waitForHumanSubmission"),
    copyLatestLocationLink: async () => "https://maps.google.com/maps?q=28.713800,77.207110&ll=28.713800,77.207110&z=16",
    getClipboard: async () => "original clipboard",
    setClipboard: async (value) => calls.push(`clipboard:${value}`),
    resetToCleanState: async () => calls.push("reset"),
    ...overrides,
  };
  const snapshots = [];
  const worker = createTelegramCaptureWorker({
    telegram: adapter,
    captureForegroundTarget: async () => ({ handle: "12", pid: 34, processName: "chrome" }),
    restoreForegroundTarget: async () => { calls.push("restore"); return true; },
  });
  return { calls, snapshots, run: () => worker.run({ captureId: "capture-123", confirmationTimeoutMs: 45000 }, (patch) => snapshots.push(patch)) };
}

test("waits for human confirmation and returns a verified snapshot", async () => {
  const h = harness();
  await h.run();
  assert.deepEqual(h.snapshots.map((s) => s.stage), ["opening_telegram", "opening_saved_messages", "opening_picker", "awaiting_confirmation", "copying_link", "captured"]);
  assert.equal(h.snapshots.at(-1).point.source, "telegram-desktop");
  assert.equal(h.snapshots.at(-1).point.accuracyM, null);
  assert.deepEqual(h.calls.slice(-3), ["reset", "clipboard:original clipboard", "restore"]);
});

test("wrong chat aborts before opening the picker and restores state", async () => {
  const h = harness({ verifySavedMessages: async () => false });
  await h.run();
  assert.equal(h.calls.includes("openLocationPicker"), false);
  assert.equal(h.snapshots.at(-1).stage, "failed");
  assert.equal(h.snapshots.at(-1).errorCode, "saved_messages_not_verified");
  assert.deepEqual(h.calls.slice(-3), ["reset", "clipboard:original clipboard", "restore"]);
});

test("confirmation timeout becomes cancelled and releases the worker", async () => {
  const h = harness({ waitForHumanSubmission: async () => { const e = new Error("timed out"); e.code = "confirmation_timeout"; throw e; } });
  await h.run();
  assert.equal(h.snapshots.at(-1).stage, "cancelled");
  assert.equal(h.snapshots.at(-1).foregroundRestored, true);
});

test("an invalid copied link becomes unparsed", async () => {
  const h = harness({ copyLatestLocationLink: async () => "not a maps link" });
  await h.run();
  assert.equal(h.snapshots.at(-1).stage, "unparsed");
});
