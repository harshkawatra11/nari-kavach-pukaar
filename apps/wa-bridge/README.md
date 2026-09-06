# Pukaar WhatsApp bridge

Laptop-local only. Never deployed, never bundled into the Next.js app. Windows only, because
`wa/desktop.win.js` drives WhatsApp Desktop through PowerShell and `AttachThreadInput`, which
has no macOS or Linux equivalent in this repo.

`wa/desktop.js` and `wa/desktop.win.js` are vendored unmodified from the author's separate
project, `harshkawatra11/whatsapp-blaster` (Apache 2.0). They expose a 15-function contract
(`isRunning`, `focus`, `openChatByNumber`, `pasteIntoComposer`, `verifyComposer`,
`pressEnterToSend`, `resetToCleanState`, `closeChat`, `clearComposer`, `getClipboard`,
`setClipboard`, `setClipboardImage`, `pasteImage`, `pasteCaption`, `discardAttachment`).
`server.js` here uses the first seven of those to send one alert message per contact.

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

`POST /alert` with `{ "phone": "919876543210", "message": "..." }` (10-15 digits, no leading
plus). Serializes sends, since WhatsApp Desktop has exactly one window: a second alert arriving
while one is in flight gets `409`. Verifies the composer actually contains the pasted message
before pressing Enter, so a clipboard race never sends a blank or stale message into a real
person's chat.
