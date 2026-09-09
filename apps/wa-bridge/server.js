require("dotenv").config();
const express = require("express");
const wa = require("./wa/desktop.js");
const { captureForegroundTarget, restoreForegroundTarget } = require("./foreground.win.js");
const { createJobStore } = require("./job-store.js");
const { createDispatchWorker } = require("./dispatch-worker.js");
const telegram = require("./telegram/desktop.js");
const { createTelegramCaptureWorker } = require("./telegram/capture-worker.js");
const { createSerialQueue } = require("./serial-queue.js");
const PORT = Number(process.env.WA_BRIDGE_PORT || 8790);
const store = createJobStore();
const captureStore = createJobStore({ idField: "captureId" });
const worker = createDispatchWorker({ wa, captureForegroundTarget, restoreForegroundTarget });
const captureWorker = createTelegramCaptureWorker({ telegram, captureForegroundTarget, restoreForegroundTarget });
const desktopQueue = createSerialQueue();
function validContact(contact) { return contact && typeof contact.name === "string" && /^\d{10,15}$/.test(String(contact.phone || "")); }
function authorized(req) { return Boolean(process.env.WA_BRIDGE_SECRET) && req.get("x-bridge-secret") === process.env.WA_BRIDGE_SECRET; }
function enqueueAlert(job) { void desktopQueue.enqueue(() => worker.run(job, (patch) => store.update(job.alertId, patch))).catch((error) => store.update(job.alertId, { stage: "failed", error: String(error) })); }
function enqueueCapture(job) { void desktopQueue.enqueue(() => captureWorker.run(job, (patch) => captureStore.update(job.captureId, patch))).catch((error) => captureStore.update(job.captureId, { stage: "failed", error: String(error) })); }
function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/healthz", async (_req, res) => {
    const [whatsappRunning, telegramRunning] = await Promise.all([
      wa.isRunning().catch(() => false),
      telegram.isRunning().catch(() => false),
    ]);
    res.json({ ok: true, whatsappRunning, telegramRunning });
  });
  app.post("/alerts", (req, res) => {
    if (!authorized(req)) return res.status(401).json({ ok: false, error: "invalid bridge secret" });
    const { alertId, contacts, message } = req.body || {};
    if (typeof alertId !== "string" || alertId.length < 8) return res.status(400).json({ ok: false, error: "alertId is required" });
    if (!Array.isArray(contacts) || !contacts.length || !contacts.every(validContact)) return res.status(400).json({ ok: false, error: "invalid contacts" });
    if (typeof message !== "string" || !message) return res.status(400).json({ ok: false, error: "message is required" });
    const returnDelayMs = Math.min(5000, Math.max(0, Number(req.body.returnDelayMs ?? 2000)));
    const result = store.create({ alertId, contacts, message, returnDelayMs });
    if (result.created) enqueueAlert(result.job);
    return res.status(result.created ? 202 : 200).json({ ok: true, ...result.job, idempotent: !result.created });
  });
  app.post("/location-captures", (req, res) => {
    if (!authorized(req)) return res.status(401).json({ ok: false, error: "invalid bridge secret" });
    const { captureId } = req.body || {};
    if (typeof captureId !== "string" || captureId.length < 8) return res.status(400).json({ ok: false, error: "captureId is required" });
    const confirmationTimeoutMs = Math.min(120000, Math.max(5000, Number(req.body.confirmationTimeoutMs ?? 45000)));
    const result = captureStore.create({ captureId, confirmationTimeoutMs });
    if (result.created) enqueueCapture(result.job);
    return res.status(result.created ? 202 : 200).json({ ok: true, ...result.job, idempotent: !result.created });
  });
  app.get("/location-captures/:captureId", (req, res) => {
    if (!authorized(req)) return res.status(401).json({ ok: false, error: "invalid bridge secret" });
    const job = captureStore.get(req.params.captureId);
    return job ? res.json({ ok: true, ...job }) : res.status(404).json({ ok: false, error: "capture not found" });
  });
  app.get("/alerts/:alertId", (req, res) => {
    if (!authorized(req)) return res.status(401).json({ ok: false, error: "invalid bridge secret" });
    const job = store.get(req.params.alertId);
    return job ? res.json({ ok: true, ...job }) : res.status(404).json({ ok: false, error: "job not found" });
  });
  return app;
}
if (require.main === module) createApp().listen(PORT, "127.0.0.1", () => console.log(`pukaar wa-bridge listening on http://127.0.0.1:${PORT}`));
module.exports = { createApp };
