# Pukaar WhatsApp bridge

Laptop-local only. Never deployed, never bundled into the Next.js app. Windows only, because
`wa/desktop.win.js` drives WhatsApp Desktop through PowerShell and `AttachThreadInput`, which
has no macOS or Linux equivalent in this repo.

`wa/desktop.js` and `wa/desktop.win.js` are vendored unmodified from the author's separate
project, `harshkawatra11/whatsapp-blaster` (Apache 2.0). They expose a 15-function contract
(`isRunning`, `focus`, `openChatByNumber`, `pasteIntoComposer`, `verifyComposer`,
`pressEnterToSend`, `resetToCleanState`, `closeChat`, `clearComposer`, `getClipboard`,
`setClipboard`, `setClipboardImage`, `pasteImage`, `pasteCaption`, `discardAttachment`).
`server.js` here uses those operations to submit one verified alert message per contact.

## Running

```
npm install
npm start
```

Listens on `http://127.0.0.1:8790` (override with `WA_BRIDGE_PORT`). Requires WhatsApp Desktop
already installed and signed in; `GET /healthz` reports whether it detects a running WhatsApp
process.

## Why this exists

The pitch is that a native Android build needs days of app-store privacy review that a hackathon
weekend does not have. The judge-facing demo runs on a laptop instead, and the WhatsApp alert has
to actually send for the demo to be convincing, not just write a database row. This bridge is
what makes "contacts get her live location" a real, visible thing that happens on stage rather
than a claim.

## API

`POST /alerts` accepts a contact batch, the alert text, and an optional foreground delay:

```json
{
  "contacts": [{ "name": "Brother", "phone": "919876543210" }],
  "message": "Pukaar alert...",
  "returnDelayMs": 2000
}
```

Phone numbers must contain 10 to 15 digits with no leading plus. The bridge serializes batches,
captures the foreground Chrome or Edge window, verifies every pasted composer before pressing
Enter, keeps WhatsApp visible for the requested delay, and restores the captured browser.

```json
{
  "ok": true,
  "contacts": [
    { "name": "Brother", "phone": "919876543210", "submitted": true }
  ],
  "foregroundRestored": true
}
```

The response reports submission rather than delivery because WhatsApp Desktop does not expose a
reliable delivery receipt to this automation layer.
