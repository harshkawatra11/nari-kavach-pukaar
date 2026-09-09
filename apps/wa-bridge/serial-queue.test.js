const test = require("node:test");
const assert = require("node:assert/strict");
const { createSerialQueue } = require("./serial-queue.js");

test("runs Telegram and WhatsApp work one at a time", async () => {
  const queue = createSerialQueue();
  const events = [];
  let releaseFirst;
  const gate = new Promise((resolve) => { releaseFirst = resolve; });
  const first = queue.enqueue(async () => { events.push("telegram:start"); await gate; events.push("telegram:end"); });
  const second = queue.enqueue(async () => { events.push("whatsapp:start"); events.push("whatsapp:end"); });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["telegram:start"]);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ["telegram:start", "telegram:end", "whatsapp:start", "whatsapp:end"]);
});

test("continues after a failed job", async () => {
  const queue = createSerialQueue();
  await assert.rejects(queue.enqueue(async () => { throw new Error("failed"); }));
  assert.equal(await queue.enqueue(async () => "next"), "next");
});
