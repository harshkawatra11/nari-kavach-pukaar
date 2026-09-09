# Pukaar desktop bridge

Laptop-local only. Never deployed, never bundled into the Next.js app. Windows only, because
the adapters drive Telegram Desktop and WhatsApp Desktop through Windows UI Automation and
`AttachThreadInput`, which have no macOS or Linux equivalent in this repo.

`wa/desktop.js` and `wa/desktop.win.js` are vendored unmodified from the author's separate
project, `harshkawatra11/whatsapp-blaster` (Apache 2.0). They expose a 15-function contract
(`isRunning`, `focus`, `openChatByNumber`, `pasteIntoComposer`, `verifyComposer`,
`pressEnterToSend`, `resetToCleanState`, `closeChat`, `clearComposer`, `getClipboard`,
`setClipboard`, `setClipboardImage`, `pasteImage`, `pasteCaption`, `discardAttachment`).
`server.js` uses those operations to submit one verified alert message per contact.

`telegram/desktop.win.js` acquires a location snapshot only through the signed-in account's
Saved Messages chat. It verifies that chat before opening Telegram's location picker, waits for
the user to confirm the pin, copies the newest location card's Google Maps link, and restores the
original clipboard and browser focus. Telegram requires no bot token, API ID, or API hash for
this desktop flow.

## Running

```
npm install
npm start
```

Listens on `http://127.0.0.1:8790` (override with `WA_BRIDGE_PORT`). Requires WhatsApp Desktop
already installed and signed in. Telegram Desktop is required only when the browser cannot
provide a coordinate. `GET /healthz` reports both desktop processes independently.

## Why this exists

The judge-facing demonstration runs on a laptop. Telegram supplies a user-verified location
snapshot when browser geolocation is unavailable. WhatsApp submits the resulting alert to each
trusted contact. One serialized queue owns both apps, foreground focus, and clipboard access, so
the two automations cannot interrupt each other.

## API

All mutating and status requests require `x-bridge-secret` matching `WA_BRIDGE_SECRET`.

`POST /alerts` accepts a stable alert ID, contact batch, alert text, and optional foreground delay:

```json
{
  "alertId": "stable-unguessable-id",
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

`POST /location-captures` creates an idempotent Telegram capture job:

```json
{
  "captureId": "stable-unguessable-id",
  "confirmationTimeoutMs": 45000
}
```

Poll `GET /location-captures/{captureId}` until the stage becomes `captured`, `cancelled`,
`failed`, or `unparsed`. During `awaiting_confirmation`, the user checks the map pin and clicks
Telegram's **Send This Location** action. A captured result contains a canonical Google Maps URL
and a point with `source: "telegram-desktop"` and `accuracyM: null`.
