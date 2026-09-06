// Pukaar WhatsApp bridge. Runs only on the demo laptop, only on 127.0.0.1.
// The alarm dispatcher in apps/web POSTs here; this process drives the real
// WhatsApp Desktop window through keyboard automation vendored from
// wa/desktop.js and wa/desktop.win.js. Deliberately not part of the Next
// app: it shells out to PowerShell, which has no business in a Vercel
// bundle, and it must keep running even if the web app reloads.
require("dotenv").config();
const express = require("express");
const wa = require("./wa/desktop.js");

const app = express();
app.use(express.json());

const PORT = Number(process.env.WA_BRIDGE_PORT || 8790);

app.get("/healthz", async (_req, res) => {
  const whatsappRunning = await wa.isRunning().catch(() => false);
  res.json({ ok: true, whatsappRunning });
});

let busy = false; // WhatsApp Desktop has one window; serialize or messages interleave.

app.post("/alert", async (req, res) => {
  const { phone, message } = req.body || {};
  if (!/^\d{10,15}$/.test(String(phone || ""))) {
    return res.status(400).json({ ok: false, error: "phone must be 10-15 digits, no plus sign" });
  }
  if (!message || typeof message !== "string") {
    return res.status(400).json({ ok: false, error: "message is required" });
  }
  if (busy) {
    return res.status(409).json({ ok: false, error: "another alert is currently sending" });
  }

  busy = true;
  try {
    if (!(await wa.isRunning())) {
      throw new Error("WhatsApp Desktop is not running. Open it and sign in, then retry.");
    }
    await wa.focus();
    await wa.resetToCleanState();
    await wa.openChatByNumber(String(phone));
    await wa.pasteIntoComposer(message);
    const ok = await wa.verifyComposer(message);
    if (!ok) {
      throw new Error("composer verification failed, refusing to press Enter to avoid sending a wrong or blank message");
    }
    await wa.pressEnterToSend();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  } finally {
    busy = false;
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`pukaar wa-bridge listening on http://127.0.0.1:${PORT}`);
});
