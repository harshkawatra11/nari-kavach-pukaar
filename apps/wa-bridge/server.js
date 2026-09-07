require("dotenv").config();
const express = require("express");
const wa = require("./wa/desktop.js");
const { captureForegroundTarget, restoreForegroundTarget } = require("./foreground.win.js");

const app = express();
app.use(express.json());
const PORT = Number(process.env.WA_BRIDGE_PORT || 8790);

app.get("/healthz", async (_req, res) => {
  const whatsappRunning = await wa.isRunning().catch(() => false);
  res.json({ ok: true, whatsappRunning });
});

let busy = false;

function validContact(contact) {
  return contact && typeof contact.name === "string" && /^\d{10,15}$/.test(String(contact.phone || ""));
}

app.post("/alerts", async (req, res) => {
  const { contacts, message } = req.body || {};
  const returnDelayMs = Math.min(5000, Math.max(0, Number(req.body?.returnDelayMs ?? 2000)));
  if (!Array.isArray(contacts) || contacts.length === 0 || !contacts.every(validContact)) {
    return res.status(400).json({ ok: false, error: "contacts must contain a name and 10-15 digit phone", contacts: [], foregroundRestored: false });
  }
  if (!message || typeof message !== "string") {
    return res.status(400).json({ ok: false, error: "message is required", contacts: [], foregroundRestored: false });
  }
  if (busy) {
    return res.status(409).json({ ok: false, error: "another alert is currently sending", contacts: [], foregroundRestored: false });
  }

  busy = true;
  const returnTarget = await captureForegroundTarget().catch(() => null);
  const clipboard = await wa.getClipboard();
  const results = [];
  let foregroundRestored = false;

  try {
    if (!(await wa.isRunning())) throw new Error("WhatsApp Desktop is not running. Open it and sign in, then retry.");
    await wa.focus();
    for (const contact of contacts) {
      try {
        await wa.resetToCleanState();
        await wa.openChatByNumber(String(contact.phone));
        await wa.pasteIntoComposer(message);
        const verification = await wa.verifyComposer(message);
        if (!verification.ok) {
          await wa.clearComposer();
          throw new Error(`composer verification failed (${verification.score.toFixed(3)}), refusing to press Enter`);
        }
        await wa.pressEnterToSend();
        results.push({ name: contact.name, phone: contact.phone, submitted: true });
      } catch (err) {
        results.push({ name: contact.name, phone: contact.phone, submitted: false, error: String(err?.message || err) });
      }
    }
  } catch (err) {
    for (const contact of contacts.slice(results.length)) {
      results.push({ name: contact.name, phone: contact.phone, submitted: false, error: String(err?.message || err) });
    }
  } finally {
    await new Promise((resolve) => setTimeout(resolve, returnDelayMs));
    foregroundRestored = await restoreForegroundTarget(returnTarget).catch(() => false);
    await wa.setClipboard(clipboard);
    busy = false;
  }

  const ok = results.every((result) => result.submitted);
  res.status(ok ? 200 : 502).json({ ok, contacts: results, foregroundRestored });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`pukaar wa-bridge listening on http://127.0.0.1:${PORT}`);
});
