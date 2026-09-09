require("dotenv").config();
const express = require("express");
const wa = require("./wa/desktop.js");
const { captureForegroundTarget, restoreForegroundTarget } = require("./foreground.win.js");
const { createJobStore } = require("./job-store.js");
const { createDispatchWorker } = require("./dispatch-worker.js");
const PORT = Number(process.env.WA_BRIDGE_PORT || 8790);
const store = createJobStore();
const worker = createDispatchWorker({ wa, captureForegroundTarget, restoreForegroundTarget });
let queue = Promise.resolve();
function validContact(contact) { return contact && typeof contact.name === "string" && /^\d{10,15}$/.test(String(contact.phone || "")); }
function authorized(req) { return Boolean(process.env.WA_BRIDGE_SECRET) && req.get("x-bridge-secret") === process.env.WA_BRIDGE_SECRET; }
function enqueue(job) { queue = queue.then(() => worker.run(job, (patch) => store.update(job.alertId, patch))).catch((error) => store.update(job.alertId, { stage: "failed", error: String(error) })); }
function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/healthz", async (_req, res) => res.json({ ok: true, whatsappRunning: await wa.isRunning().catch(() => false) }));
  app.post("/alerts", (req, res) => {
    if (!authorized(req)) return res.status(401).json({ ok: false, error: "invalid bridge secret" });
    const { alertId, contacts, message } = req.body || {};
    if (typeof alertId !== "string" || alertId.length < 8) return res.status(400).json({ ok: false, error: "alertId is required" });
    if (!Array.isArray(contacts) || !contacts.length || !contacts.every(validContact)) return res.status(400).json({ ok: false, error: "invalid contacts" });
    if (typeof message !== "string" || !message) return res.status(400).json({ ok: false, error: "message is required" });
    const returnDelayMs = Math.min(5000, Math.max(0, Number(req.body.returnDelayMs ?? 2000)));
    const result = store.create({ alertId, contacts, message, returnDelayMs });
    if (result.created) enqueue(result.job);
    return res.status(result.created ? 202 : 200).json({ ok: true, ...result.job, idempotent: !result.created });
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
