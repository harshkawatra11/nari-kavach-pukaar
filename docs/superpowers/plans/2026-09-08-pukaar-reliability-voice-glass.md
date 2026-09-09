# Pukaar reliable alerts, natural Hinglish and glass orb implementation plan

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task by task. Complete the checkboxes and their verification gates. This document is an implementation specification, not a report of completed repairs.

**Goal:** Make remembered variations of the configured safety phrase reliably start an observable WhatsApp handoff with usable location links, make Maa's Hinglish conversation coherent and interruptible, and render a centered, visibly dimensional glass orb with a restrained entrance.

**Architecture:** Retain Next.js, the local Node Sarvam relay, the local Windows WhatsApp bridge and shared Firestore. Separate phrase detection, alert acceptance, desktop submission and location synchronization. Keep one Three.js canvas per orb placement; animate scene properties with a single writer and fade the surrounding DOM using Framer Motion.

**Stack:** Installed baseline: Next 16.3.3, React 19.2.8, Three 0.185.1, R3F 9, drei 10, Framer Motion 11, GSAP 3, Node 22+, pnpm 9.15.9, Vitest 4.1.11. Do not upgrade the stack as part of this repair.

**Root:** `C:\Users\harsh\Desktop\HARSH\WEB-DEV-PROJECTS\nari-kavach`.

**Read first:** [audit and primary-source ledger](../../research/2026-09-08-pukaar/report-source.md). It contains the actual test observations, evidence IDs and limitations. Baseline commit is `9ced54c`.

**Implementation appendix:** [copy-ready matcher, rolling window and geometry checks](2026-09-08-pukaar-reference-code.md). Use these implementations for Task 1 rather than inventing another fuzzy matching algorithm. They have a standalone, zero-provider verification harness.

## Global constraints

- Latest scope is planning. Do not mistake this saved plan for permission to silently perform live recipient tests during planning.
- At execution, keep localhost web, relay and bridge separate from public Vercel tracking. Do not build an APK or deploy the desktop bridge.
- Never change the public tracking origin to localhost. Never expose local bridge through a public tunnel.
- Maa / Mother is the cover persona. Trusted recipients, including a brother, are independent contacts.
- Use Hinglish. English words remain English; Hindi speech text should use Devanagari for synthesis. Written script and spoken language are different decisions.
- No paid Sarvam calls in unit/integration tests. See the tightly bounded live evaluation budget in Task 10.
- No audio or full transcripts in Firestore or diagnostic logs. Never print API keys, private coordinates, complete phone numbers or bearer tokens.
- No em dashes in new content. No AI co-author trailers. Owner-authenticated GitHub CLI workflow remains in force.
- User's latest product-design instructions supersede old deck-derived zero-radius rules in AGENTS.md. Update that stale rule in Task 0. Keep current minimal dark UI and semantic radius tokens.
- Do not claim delivered, offline recognition, guaranteed protection, exact GPS accuracy or a measured 1.2s response time without corresponding evidence.
- A source/tool saying an API exists is not evidence that a local integration works. Verify contracts with fixtures, then bounded real calls.
- All paths below are relative to the root above. Check git status before edits, preserve unrelated user work, and use native PowerShell file operations on Windows.

## Execution order and gates

| Order | Task | Completion gate |
|---:|---|---|
| 0 | Baseline, configuration and diagnostics | Safe health report; no secrets; baseline tests |
| 1 | Shared contracts and phrase profile | Matcher handles required positive/negative cases |
| 2 | Rolling transcripts and trigger transport | Split phrase triggers once; HTTP errors remain visible |
| 3 | Bridge cleanup, queue and idempotency | Mocked failures release worker; ambiguous send never auto-retries |
| 4 | Alarm persistence and status UI | Detection, submission and failure are distinguishable |
| 5 | Location upload and public tracker | Last acknowledged point readable on public origin |
| 6 | Persona, pronunciation and turn management | Deterministic tests pass; no concurrent speaking turns |
| 7 | Glass shape, lighting and framing | Unclipped sphere with visible depth in Chrome |
| 8 | Entrance, centering and call reactivity | One persistent canvas; no jump; motion follows audio |
| 9 | CI and system fault tests | Web, relay, core and bridge suites all run |
| 10 | Bounded live rehearsal and deployment | Real outcome recorded honestly; no unexplained pending states |

Finish Tasks 0-5 before changing voice generation. Tasks 7-8 may run independently after Task 0 if using another worker, but only one worker may edit a given file. Do not sacrifice alert verification for visual polish.

## Task 0: Baseline and useful diagnostics

**Files:** Modify `AGENTS.md`, `docs/ARCHITECTURE.md`, `.env.example`; create `scripts/doctor.mjs`; modify `package.json` and create `apps/web/src/app/api/readiness/route.ts`.

- [ ] Read `README.md`, root and web AGENTS.md, this plan and the audit. Record current HEAD and git status in the execution notes.
- [ ] Run the following in the repo root. If ports are already healthy, keep them running. If missing, run the named script in a separate hidden background process with separate stdout/stderr logs. Never start a second Next dev process on 3001 to conceal a port conflict.

```powershell
git status --short
git log -1 --oneline
pnpm test
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:8787/healthz
Invoke-RestMethod http://127.0.0.1:8790/healthz
# Only for a service confirmed absent:
# pnpm dev:web
# pnpm dev:relay
# pnpm dev:wa
```

Baseline observed in audit: core 43 tests, relay 2 tests. Do not hardcode those counts after adding tests.

- [ ] Replace obsolete AGENTS.md product rules with: "Product UI uses the current monochrome tokens and semantic radii. Pitch-deck visual rules do not apply to product UI. Add orb colors as CSS tokens; resolve them once after mount for Three.js. Do not scatter raw color literals across components."
- [ ] `doctor.mjs` must read env files without importing modules that throw secrets. Report only `{webHealthy,relayHealthy,bridgeHealthy,whatsappRunning,bridgeBusy,publicOriginValid,relaySecretMatches,firebaseConfigured,sarvamConfigured}`. Check selected local variables in memory; print booleans, endpoint origins and HTTP codes only. Exit 1 when required service checks fail. No automatic alarm or TTS probes.
- [ ] Add `pnpm doctor` for this script. Keep `/api/health` cheap and dependency-free. Add `/api/readiness` for setup: concurrently check relay and bridge health with 2s limits, return only capabilities and reasons. On Vercel return `desktopDispatchAvailable:false` rather than trying to use Vercel's loopback as the user's PC. Use explicit `LOCAL_DESKTOP_DEMO=true` locally, `false` on Vercel.
- [ ] Keep verified local origin config: `PUBLIC_TRACKING_ORIGIN=https://pukaar-web-wine.vercel.app`, `WA_BRIDGE_URL=http://127.0.0.1:8790`, relay `WEB_ORIGIN=http://localhost:3000`. Add server-only `WA_BRIDGE_SECRET` to both local web and bridge envs; generate locally and never print it. Add empty example entry only.
- [ ] Verify readiness reports bridge-down without blocking homepage or call audio. Setup should say "WhatsApp unavailable on this device" and allow an informed demo-only call, not imply desktop alerts are ready.

## Task 1: A phrase is a remembered meaning, not character similarity

**Files:** Create `packages/core/src/duress-profile.ts`, `duress-profile.test.ts`, `transcript-window.ts`, `transcript-window.test.ts`; modify `packages/core/src/index.ts`, `types.ts`; later consumers: `DuressPhrasePicker.tsx`, setup, session API and relay hello.

**Decision:** Support ordered distinctive anchor groups for the built-in demo and user-confirmed custom profiles. Caller prefix is optional. All distinctive groups must occur within one short window. Never accept a single common word or lower the old 0.82 threshold. Preserve old `detectDuress` only for legacy tests/diagnostic similarity; it must not bypass the new armed profile.

Use these public types:

```ts
export interface PhraseProfile {
  version: 1;
  mode: "anchors" | "exact";
  displayPhrase: string;
  anchors: Array<{ id: string; aliases: string[] }>;
  exactVariants: string[];
  maxSpanTokens: number;
}
export interface PhraseDecision {
  matched: boolean;
  reason: "anchors" | "exact" | "incomplete" | "negated";
  matchedAnchorIds: string[];
}
export interface TranscriptSegment {
  id: string;
  text: string;
  at: number;
  final: boolean;
}
```

Default demo profile, copied into one shared exported constant. Change setup's current kitchen phrase and the picker reset button together. Existing sessions retain their stored phrase and do not silently migrate kitchen to drawer.

```ts
export const DEMO_PHRASE_PROFILE: PhraseProfile = {
  version: 1,
  mode: "anchors",
  displayPhrase: "Mummy ko bol dena blue notebook drawer mein rakhi hai",
  anchors: [
    { id: "blue", aliases: ["blue", "blu", "ब्लू", "नीली", "neeli", "nili"] },
    { id: "notebook", aliases: ["notebook", "note book", "नोटबुक", "नोट बुक"] },
    { id: "drawer", aliases: ["drawer", "drawar", "ड्रॉअर", "ड्रावर", "दराज", "दराज़", "daraz"] },
  ],
  exactVariants: [],
  maxSpanTokens: 16,
};
```

Do not automatically equate a notebook with any book or drawer with kitchen. Those are changes in meaning. The user can explicitly add another accepted variant during setup. A built-in kitchen profile, if retained, needs its own place anchor and tests.

- [ ] Add Unicode NFC normalization, lowercase and punctuation removal preserving `\p{M}`. Unlike old normalization, do not drop negations. Match aliases as complete token sequences, longest alias first; no substring matches inside unrelated words.
- [ ] For anchor mode, find each group in order, starting at each possible first-group occurrence. Accept only spans up to 16 tokens. Check negation in the span and the following four normalized tokens. Reject `nahi`, `nahin`, `नहीं`, `नही`, `not`, `never` in that local candidate. If another valid non-negated occurrence appears later, it can match. This intentionally conservative policy can reject a following corrective clause even across punctuation, as implemented in the appendix. Show the behavior in preview rather than implying general language understanding.
- [ ] Exact mode uses normalized whole token sequences for each confirmed variant. Custom anchor mode requires at least three nonempty groups; limit to six groups and eight aliases each. Phrase text max 240 chars, alias max 60 chars, exact variants max eight. Return a validation error for overlapping/identical anchor groups rather than weakening matching.
- [ ] Setup shows "Words to remember: blue · notebook · drawer" and "You can say Mummy or Papa and add words before the phrase." Include a local "Try a variation" input using the real matcher; this does not send anything or contact Sarvam. Custom phrases show which exact variants or groups will actually work, with an Edit disclosure. Do not imply arbitrary paraphrases are supported.

Required test fixture:

```ts
import { describe, expect, it } from "vitest";
import { matchPhrase, DEMO_PHRASE_PROFILE } from "./duress-profile";

describe("demo phrase", () => {
  it.each([
    "Mummy ko bol dena blue notebook drawer mein rakhi hai",
    "Papa ko bol dena blue notebook drawer mein rakhi hai",
    "Oh accha haan ek baat aur yaad aayi Mummy ko bol dena blue notebook drawer mein rakhi hai",
    "blue notebook drawer mein rakhi hai",
    "blue note book drawer mein hai",
    "मम्मी को बोल देना ब्लू नोटबुक ड्रॉअर में रखी है",
    "Papa को बोल देना blue नोटबुक drawer में रखी है",
    "नीली नोटबुक दराज में रखी है",
  ])("accepts %s", (text) => {
    expect(matchPhrase(text, DEMO_PHRASE_PROFILE).matched).toBe(true);
  });
  it.each([
    "Mummy ko bol dena red notebook drawer mein rakhi hai",
    "Mummy ko bol dena blue notebook kitchen mein rakhi hai",
    "blue notebook", "drawer mein rakhi hai", "blue", "bluebook notebook drawer",
    "blue notebook drawer mein nahi hai", "ब्लू नोटबुक दराज में नहीं है",
    "kal ka plan kya hai", "Mummy ko bol dena khana kha liya",
  ])("rejects %s", (text) => {
    expect(matchPhrase(text, DEMO_PHRASE_PROFILE).matched).toBe(false);
  });
});
```

**Rolling window:** export `createTranscriptWindow(): { upsert(segment: TranscriptSegment): string; reset(): void }`. Keep at most three finalized fragments plus one current partial, at most 64 total tokens, age at most 12,000ms. Clear on a gap over 8,000ms, session change, disconnect, and call end. Same ID updates replace, never append. A final replaces its partial. IDs include STT connection epoch to prevent reused `utteranceIdx=0` collisions after reconnect. Never combine different speakers or different recognition sources into one buffer.

```ts
it("joins finals without duplicating partials", () => {
  const w = createTranscriptWindow();
  w.upsert({ id:"a", text:"blue note", at:1000, final:false });
  w.upsert({ id:"a", text:"blue notebook", at:1200, final:true });
  const text = w.upsert({ id:"b", text:"drawer mein rakhi hai", at:2500, final:true });
  expect(text).toBe("blue notebook drawer mein rakhi hai");
  expect(matchPhrase(text, DEMO_PHRASE_PROFILE).matched).toBe(true);
});
it("does not combine distant mentions", () => {
  const w = createTranscriptWindow();
  w.upsert({ id:"a", text:"blue notebook", at:1000, final:true });
  const text=w.upsert({ id:"b", text:"drawer mein hai", at:10001, final:true });
  expect(matchPhrase(text, DEMO_PHRASE_PROFILE).matched).toBe(false);
});
```

Also test two finals with identical text but different IDs, punctuation, empty input, expiry, replacement of interim hypothesis, maximum size and cross-session reset. Export new functions from `index.ts`. Run `pnpm --filter @pukaar/core test` before integration.

## Task 2: Integrate recognition without conflating it with dispatch

**Files:** `apps/relay/src/session.ts`, `sarvam/stt-ws.ts`, `alarm.ts`, `packages/core/src/protocol.ts`, `apps/web/src/hooks/useLocalDuressSpotter.ts`, `useVoiceSession.ts`, setup/session creation and `CallScreen`.

- [ ] Persist `phraseProfile` with the session; extend `SessionDoc` and the creation request. Pass the same validated profile to browser matcher and relay hello. If a legacy session has no profile, use exact normalized configured phrase plus explicitly stored variants; show legacy limitations. Never silently arm the demo phrase for an arbitrary old session.
- [ ] Set realtime STT `mode:"translit"`, keep `saaras:v3-realtime`, `stream_type:"fast"`, `language_code:"auto"`, 16kHz mono. Request timestamps. Keep current 500ms endpoint silence initially; test 650ms only if live observations show premature splits. Do not switch to v4 during this repair.
- [ ] Forward `vad.speech_start`/`vad.speech_end` to the client. Add `t:"vad",state:"start"|"end",utteranceIdx:number` to `ServerFrame`. Treat language fields as optional when a language is fixed.
- [ ] Relay evaluates each final using its rolling window before awaiting any model call. It may evaluate partials for a UI candidate state but only finals submit automatically in the initial repair. Browser SpeechRecognition similarly commits only `isFinal` results. This avoids acting on a transient partial that later adds a negation. Clearly document finalization latency; do not advertise instant partial triggering.
- [ ] Use real recognition `onstart` to set browser detector armed. Handle `not-allowed`, `service-not-allowed`, `audio-capture` as unavailable; do not loop restart on permanent errors. Transient restarts use one timer with 500ms/1000ms/2000ms backoff, canceled on teardown. Give each restart a new epoch.
- [ ] Replace `alarmRaised`/`firedRef` transport semantics with two fields: detection latch and known alert acceptance. A detector emits `phrase_detected` immediately, but successful request acceptance is a separate event. On transport failure retain the detection and expose dispatch failure. A match must not depend on the LLM also agreeing.
- [ ] `raiseAlarm` must return the parsed response or throw a typed error, with an 8s HTTP timeout. It must not swallow errors. A repeated acceptance POST uses the same `alertId` and frozen data from Task 4. This HTTP retry does not mean pressing Enter again.
- [ ] Replace relay `t:"alarm"` frame with `t:"alert-status", alertId, stage, errorCode?`. Keep a temporary legacy frame adapter during rollout that maps old `alarm` to detected only. Update all exhaustive switches.
- [ ] Model `raise_alarm` tool must submit only when supported by the configured phrase profile/recent user window. Remove broad "otherwise signals danger" wording from the tool to avoid uncontrolled alerts during an app explanation. A manual alert remains a separate explicit user action. Broader distress classification requires its own evaluation and is outside this repair.
- [ ] Do not put location, recipients or bridge failure in the spoken conversation. Return a neutral internal tool result such as `{accepted:true}` only when accepted; never fake `{ok:true}` on failed HTTP.

Tests: mock chat/TTS/STT and fetch. Exact phrase, split phrase, native script and browser-only path each create one accepted alert. Both recognizers firing concurrently still produce one alert ID. A 401 or connection refusal results in failed transport state, not submitted state. A duplicate final does not make a second model call or alarm POST. All these tests must run without a microphone or provider key.

## Task 3: Make the local bridge observable, retry-safe and exception-safe

**Files:** Refactor `apps/wa-bridge/server.js`; create `app.js`, `dispatch-worker.js`, `job-store.js`, `dispatch-worker.test.js`, `app.test.js`, `job-store.test.js`; modify `package.json`, `.gitignore`. Use built-in `node:test` and injected adapters. Do not edit the vendored `wa/desktop.win.js` casually; changes there require a documented local fork/provenance update or upstream repair.

### 3A. First remove the confirmed stuck-busy defect

- [ ] Move capture and clipboard reads inside the protected operation. An outer finally always releases the worker; clipboard restore gets its own catch; focus restore must execute even if sending failed. Only restore clipboard if it was captured. Never treat cleanup failure as permission to send again.

Reference control flow for `dispatch-worker.js` (dependencies are injected so Node tests never load the real desktop module):

```js
async function processJob(job, deps) {
  let target = null;
  let clipboard;
  let clipboardCaptured = false;
  let focused = false;
  try {
    target = await deps.captureForegroundTarget();
    if (!target) throw new Error("RETURN_TARGET_UNAVAILABLE");
    clipboard = await deps.wa.getClipboard();
    clipboardCaptured = true;
    if (!(await deps.wa.isRunning())) throw new Error("WHATSAPP_NOT_RUNNING");
    await deps.wa.focus();
    focused = true;
    for (const contact of job.contacts) {
      if (contact.status === "submitted" || contact.status === "unknown") continue;
      try {
        await deps.store.contactStage(job.id, contact.phone, "preparing");
        await deps.wa.resetToCleanState();
        await deps.wa.openChatByNumber(contact.phone);
        await deps.wa.pasteIntoComposer(job.message);
        const verified = await deps.wa.verifyComposer(job.message);
        if (!verified.ok) throw new Error("COMPOSER_MISMATCH");
        await deps.store.contactStage(job.id, contact.phone, "submitting");
        try {
          await deps.wa.pressEnterToSend();
        } catch {
          await deps.store.contactStage(job.id, contact.phone, "unknown", "ENTER_RESULT_UNKNOWN");
          continue;
        }
        await deps.store.contactStage(job.id, contact.phone, "submitted");
      } catch (error) {
        // If journal already says submitting, use unknown, never failed.
        await deps.store.failContactSafely(job.id, contact.phone, String(error.message));
      }
    }
  } catch (error) {
    await deps.store.failUnstarted(job.id, String(error.message));
  } finally {
    try {
      if (focused) await deps.delay(job.returnDelayMs);
      const restored = await deps.restoreForegroundTarget(target).catch(() => false);
      await deps.store.restoration(job.id, restored);
    } finally {
      if (clipboardCaptured) {
        await deps.wa.setClipboard(clipboard).catch(() => undefined);
      }
    }
  }
}
```

The queue owns the lock, not this function. Its `try { await processJob(...) } finally { activeId=null; drainNext(); }` must run even if job-store persistence itself throws. Record a bounded, redacted process-level error on persistence failures.

### 3B. Replace a long HTTP request with a small local job protocol

Existing 60s web request is a poor fit for serialized desktop operations. The bridge is an already-running local process, so it can own a durable queue. Do not put background desktop work in a Vercel handler.

```ts
type DispatchStage = "detected" | "queued" | "preparing" | "submitting"
  | "submitted" | "partial" | "failed" | "unknown";
type ContactStage = "queued" | "preparing" | "submitting" | "submitted" | "failed" | "unknown";
interface DispatchContact {
  name: string;
  phone: string;
  status: ContactStage;
  submitted: boolean;
  errorCode?: string;
}
interface DispatchSnapshot {
  alertId: string;
  attempt: number;
  stage: DispatchStage;
  contacts: DispatchContact[];
  foregroundRestored: boolean | null;
  updatedAt: number;
  errorCode?: string;
}
```

- [ ] `POST /alerts`, authenticated with `x-bridge-secret`, accepts `{alertId,attempt,contacts,message,returnDelayMs:2000,expiresAt}`. `alertId` is the server-owned ID from Task 4; `attempt` starts at 1. Return 202 with a `DispatchSnapshot` after durably storing the job, before focusing WhatsApp. Repeated same ID/attempt/body returns the same job. Same ID/attempt with changed body returns 409 `IDEMPOTENCY_CONFLICT`.
- [ ] `GET /alerts/:alertId?attempt=1`, same secret, returns the snapshot or 404. No job details in unauthenticated `/healthz`. Extend health with `{ok,whatsappRunning,busy,queueDepth,version:2}`.
- [ ] Bind to `127.0.0.1`, reject unsupported methods/content types, cap body at 16KB, limit message to 4000 chars, contacts to 1-4, require normalized digits. Reject missing/incorrect secret before accessing Windows. Do not enable permissive browser CORS.
- [ ] Normalize Indian 10-digit inputs to `91` plus number at setup/server validation. For international numbers require explicit country prefix; normalize `+` and spaces, dedupe by normalized phone. Do not silently discard invalid configured contacts. Show a validation error.
- [ ] `job-store.js` stores each job in an ignored `apps/wa-bridge/.state/` directory, canonical path computed from `__dirname`. File name uses only validated alert ID and numeric attempt. Write to a sibling temp file and atomically rename after JSON serialization. Queue order, content hash, contact stage and expiry are persisted. Use SHA-256 of stable `{contacts,message}` serialization, not the raw message in logs. Read-modify-write operations must be serialized in one promise chain per store instance.
- [ ] Startup converts persisted `submitting` to `unknown` and pauses all nonterminal recovered jobs for explicit resume. Never auto-submit recovered jobs after a restart. `submitted` stays submitted. Remove expired journal files only within the resolved `.state` directory after enforcing expiry on reads; add `.state/` to gitignore. Retention is session expiry, not indefinite.
- [ ] Define store methods used above: `contactStage(id,phone,status,errorCode?)`, `failContactSafely(id,phone,code)`, `failUnstarted(id,code)`, `restoration(id,boolean)`, `get(id,attempt)`, `create(job)`. In implementation `id` denotes the internal `${alertId}:${attempt}` job key, while HTTP uses `alertId` plus `attempt`. Each method awaits persistence before resolving.
- [ ] After Enter has been attempted, a throw or process crash is ambiguous. Mark unknown and require manual verification. No automatic retry. Only contacts explicitly failed before Enter are eligible for an operator-requested attempt 2 or 3. Never resend already-submitted contacts.
- [ ] Keep 2000ms dwell once after the batch, then restore captured browser HWND. Capture fails closed if foreground is not Chrome/Edge. Preserve actual HWND/PID checks. If user moves focus away during sending, vendor focus checks must stop subsequent keystrokes; do not forcefully grab unrelated apps to continue.
- [ ] Composer content verification is not recipient verification. Keep recipient navigation as a separately logged stage, and verify its real behavior in the final consenting rehearsal. If the desktop version has no reliable programmatic identity readback, explicitly retain that limitation. Do not claim cryptographic or guaranteed recipient verification from a clipboard check.

Required failure tests with injected adapters: clipboard read rejects; clipboard restore rejects; focus fails; composer mismatches; Enter throws; journal write after Enter fails; one contact succeeds and second fails; foreground restore fails; two batches arrive concurrently; same ID arrives twice; process restart with submitting record. In every test, assert exact Enter call count and worker unlock. A test may not execute PowerShell or depend on WhatsApp being installed.

Minimal regression pattern:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
test("clipboard failure releases queue without pressing Enter", async () => {
  const fixture = makeWorkerFixture({ failAt: "getClipboard" });
  await fixture.enqueueAndDrain();
  assert.equal(fixture.enterCount(), 0);
  assert.equal(fixture.isBusy(), false);
  assert.equal(fixture.snapshot().stage, "failed");
});
```

Create `makeWorkerFixture` in `test/fixture.js`: fake all six store mutations with an in-memory record, fake every `wa` operation as a recorded async function, count Enter calls, inject a throwing operation named by `failAt`, and use zero-time delay. Reuse only this explicit fixture in bridge tests.

## Task 4: Persist the alert lifecycle before touching the desktop

**Files:** Create `packages/core/src/dispatch.ts` and test; `apps/web/src/lib/firestore/dispatch.ts`, `dispatch.test.ts`; modify `/api/alarm`, `lib/wa/bridge.ts`, `lib/firestore/alerts.ts`, `/api/session/[id]/alert-result`, `CallScreen`, `AlarmToast`, `Inspector`; create `useAlertDispatch.ts` and tests.

- [ ] Put the DispatchSnapshot types in `packages/core/src/dispatch.ts`; bridge JS uses JSDoc for the same contract. `submitted` means Enter completed, never delivered. `foregroundRestored:null` means not attempted yet.
- [ ] Replace the 15s dedupe window with one primary alert per session. Use `alerts/{sessionId}` as deterministic primary ID. In a transaction read session plus alert, reject absent/ended/expired session, return existing alert if present, otherwise create it with stage detected and attempt 1. Read all documents before writes. No network or OS operation inside a transaction.
- [ ] Freeze message text, public URL, point snapshot and contact list when alert is created. Do not regenerate timestamps or freshness labels on retries, or idempotency hash will change. Store privacy-sensitive snapshot only in protected Firestore and expiring local journal. Do not include it in logs/public stream.
- [ ] `/api/alarm` calls the fast bridge acceptance endpoint with an 8s deadline after transaction commits. On accepted job update alert queued. Return `{ok:true,alertId,stage:"queued"}`. On unreachable bridge persist failed with `BRIDGE_UNREACHABLE`, return 503 with the same alertId. On timeout after uncertain acceptance query the job ID; while uncertain use unknown transport state and poll, never enqueue a new ID.
- [ ] Update `sendWhatsAppAlerts` into explicit `submitWhatsAppJob` and `getWhatsAppJob`. Validate status code and response shape. A nonempty expected contact list must not accept an empty response array as progress or success. Unexpected body becomes `BRIDGE_PROTOCOL_ERROR`.
- [ ] `/api/session/[id]/alert-result` reads deterministic alert, fetches latest bridge snapshot locally if nonterminal, and persists changes. Public Vercel returns the last persisted status without querying local bridge. No side effects other than reconciling the same known job. Return `{ok:true,found:true,...snapshot}` immediately even if queued; no waiting for whole batch.
- [ ] Backward compatibility: when deterministic record absent, read old matching alert documents and map `submitted ?? sent ?? false`. Stop writing legacy `sent`. Do not select arbitrary latest ten docs as the primary workflow.
- [ ] `useAlertDispatch` polls every 1000ms while queued/preparing/submitting. After 120s without a terminal state show "Submission status unavailable" with refresh/manual fallback. Cancel timers and fetches on unmount. A timeout does not mean message failed, and does not authorize resend.
- [ ] Add explicit retry for known pre-Enter failed contacts only. New route `POST /api/session/[id]/retry-alert` validates previous terminal result, increments attempt at most to 3, freezes a contact subset from the original record and calls the bridge. Unknown contacts are excluded and require checking WhatsApp manually. Repeated retry request with same attempt is idempotent.
- [ ] Harden ownership alongside these status routes: mint a separate 32-byte random `controlToken` during session creation, store SHA-256 hash in session, keep token only in current tab sessionStorage. Require `x-session-control` for browser alarm, location, end, alert-result and retry routes; trusted relay may use shared secret. Never allow `trackToken` as a write credential. Validate relay hello against a server-only session-config endpoint before opening paid STT. Do not expose control token in URL or logs. Old sessions without token must restart setup for writes; old read-only tracking keeps working until expiry.
- [ ] Public tracking DTO contains only display name, status, expiry and coordinates needed by recipient. Remove `alarm.reason` and full private phrase from SSE output. Alert sender recognition reason logs contain rule ID, source and score/category only, never matched transcript text.

Exact UI state copy:

| State | Text | Action |
|---|---|---|
| Detected | Phrase recognized | None |
| Queued/preparing | Preparing WhatsApp | None |
| Submitting | Submitting to WhatsApp | None |
| Submitted | Submitted to WhatsApp | Open tracking |
| Partial | Submitted to 1 of 2 contacts | Inspect remaining contact result |
| Failed before Enter | WhatsApp could not submit the alert | Retry failed contacts; copy prepared message |
| Unknown | Check WhatsApp before retrying | Open instructions; no automatic resend |
| Restore failed | Return to Pukaar manually | Keep submitted result unchanged |

No red shockwave on the orb for an alert. The public-facing cover call stays ordinary. Put diagnostic submission state in the inspector; support existing demo visibility without spoken acknowledgment.

## Task 5: A captured point is not yet a shared point

**Files:** Create `apps/web/src/lib/location-client.ts` and tests, `hooks/useGeoTrail.test.ts`; modify `useGeoTrail`, setup, call, `packages/core/src/geo.ts` and tests, Firestore sessions, location/end APIs, tracking stream/page and `LiveMap`.

Use this state, separate from render animation:

```ts
interface LocationSyncState {
  captured: GeoPoint | null;
  persisted: GeoPoint | null;
  sync: "idle" | "uploading" | "synced" | "failed";
  permission: "unknown" | "granted" | "denied";
  errorCode: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT"
    | "UPLOAD_FAILED" | "SESSION_EXPIRED" | null;
}
```

- [ ] Map a browser position using `at: pos.timestamp`, not Date.now. Store upload receipt separately. Validate finite latitude [-90,90], longitude [-180,180], nonnegative finite accuracy, timestamp >0 and no more than 30s in future. Never fabricate coordinates when permission fails.
- [ ] Use shared `uploadLocation(sessionId,controlToken,point,signal)` in both setup and hook. Check `response.ok` and parsed `ok`; return server's `persistedPoint`. Server replies with last accepted point on a gated no-op. Unknown session returns 404, ended/expired 410, bad input 400. A no-op is not equivalent to unknown session.
- [ ] Setup keeps its 8s location request. Store `pukaar.initialLocation` only when upload acknowledged. If upload fails, preserve captured point separately for retry and say "Location captured, not shared yet." Continue call without claiming Maps location was sent.
- [ ] Hook serializes uploads and coalesces pending points to latest. Retry transport/5xx at 1s, 2s, 4s, then failed state with explicit retry. Cancel on session end/unmount. No retry for 400/401/404/410 until user fixes the cause. Successful acquisition clears availability errors; successful upload changes persisted state.
- [ ] Use a transaction for append: recheck active/expiry, ignore older/equal timestamps, preserve existing movement/time gate. Cap stored trail at 720 latest points so six-hour session cannot grow past Firestore document limits. Update the array with the bounded result, not unbounded arrayUnion. New points are genuine measurements only; never refresh timestamp of an old fix to keep it looking live.
- [ ] Inspector freshness uses persisted point, plus a separate "Location not shared yet" label when only captured exists. Fresh means age <60,000ms, stale means >=60,000ms. Add boundary tests; current <=60,000 implementation should change to match text contract.
- [ ] Both end-call controls call a shared `handleEnd`: immediately stop microphone/playback/spotter, await end API with a 3s timeout, navigate home. If offline, retain a session-end retry record scoped to current session, but audio must stop immediately. Do not keep active voice resources waiting for HTTP.
- [ ] Tracking SSE uses a serialized async loop, not overlapping setInterval queries. Catch transient Firestore errors and emit `connection-status:{state:"retrying"}`. Check abort before every enqueue. On absent token emit `terminal:{code:"NOT_FOUND"}`, expired `EXPIRED`, ended send final update then terminal `ENDED`. Client closes on terminal. Use no-store cache headers and `Referrer-Policy:no-referrer` on recipient page.
- [ ] Public client shows connection loss on native EventSource errors with no payload, reconnects with capped backoff, and preserves old point labeled last known. Add local expiry timer so expiry works even during connection loss. Never leave blank "Waiting" forever for a backend error.
- [ ] Replace false map canvas with an honest position card: large "Latest shared location", coordinate pair, accuracy, measured age and an ordinary anchor to Google Maps. Keep actual map tiles optional after reliability passes; a blank rectangle with centered dot is not a map. This avoids new map API costs and keeps the exact coordinate URL independently useful.
- [ ] Tighten public-origin validation for credentials in URL, loopback IPv6, `.localhost`, link-local and private IPs. Prefer the known canonical host for this demo. Never put a session ID alone into a public tracking URL; use the read token from creation. Preserve six-hour expiry checks independently of Firestore TTL cleanup.

Required tests: upload 500 cannot report synced; successful retry clears failure; timestamp reflects cached position; denied then successful watch recovers; stale point labeled correctly; no point omits Maps section; invalid/expired session cannot write; end-call updates session; stream error explains retry; ended/expired/not-found stops reconnect; public read token cannot write.

## Task 6: Make Maa sound attentive and allow interruption

**Files:** `packages/core/src/persona.ts` plus new `persona.test.ts`; `apps/relay/src/session.ts`, `sarvam/chat.ts`, `sarvam/tts-rest.ts`, `sarvam/stt-ws.ts`, `env.ts`; new `turn-controller.ts` and tests; `apps/web/src/lib/audio/playback.ts` and tests; `useVoiceSession.ts`; `protocol.ts`.

### Persona and speech text

- [ ] Replace the existing friend prompt. Keep conversation contextual, no forced question after every reply, no made-up shared memories and no repeated "main line pe hoon" filler. Opening must enter assistant history before first user turn.

Use this prompt content, with userName JSON-quoted as data and phrase detection details supplied separately from conversational identity:

```text
You are playing Maa in a consensual cover-call demo with the user.
Speak like an everyday Indian mother on a relaxed phone call.
Use natural Hinglish, never formal Hindi or customer-support English.
Write Hindi words in Devanagari and familiar English words in Latin script.
Respond to the specific thing the user just said before introducing another topic.
Use one short sentence, sometimes two when the thought needs it.
Do not ask a question at the end of every turn. A natural acknowledgment is often enough.
Do not repeatedly ask whether she ate, where she is, or what tomorrow's plan is.
Do not invent facts about her life or claim to see her surroundings.
Remember details she supplied earlier in this call and refer to them only when relevant.
If she corrects herself or interrupts, follow the correction and stop the old thought.
Never recite or prompt the configured private phrase.
Never narrate alarm, tracking, contact notification, tools or internal failures aloud.
If an internal tool runs, continue the ordinary conversation without acknowledging it.
Return spoken dialogue only, with no markdown, emojis, stage directions or em dashes.
```

Opening: `हाँ बेटा, बोलो. आज का दिन कैसा था?` Include in history exactly once. The consent/demo identity is explained by app UI, not repeatedly narrated during the cover call.

- [ ] Keep `sarvam-105b-conversations`, `reasoning_effort:null`, temperature 0.65 and max_tokens 160 as initial settings. They are design starting points, not measured optima. Leave nonstreaming chat for first repair; short contextual replies and correct interruption matter more than a risky streaming rewrite. Remove unused `toolResultRound` or make it force `tool_choice:"none"` on tool follow-up. Satisfy every returned tool call ID exactly once and cap at one follow-up round.
- [ ] Keep last eight complete user/assistant exchanges plus system and opening. Trim complete exchanges/tool bundles, never raw array slices that orphan a tool message. Add tests for history order after 20 turns. Track provider timing/usage only, no raw conversation logging.
- [ ] Replace whole-string banned-word substring matching with narrowly defined disclosure patterns in Roman Hindi, Devanagari and English. Reject explicit claims such as "I sent your location", "मैंने location भेज दी", "police ko message kar diya" and echo of configured phrase. Do not drop a normal sentence containing "alarm clock" merely because it includes alarm. Run guard before any speech audio is created. Cycle two neutral contextual acknowledgments only as error fallback and record a counter; do not use fallback as ordinary dialogue generation.

### Pronunciation, without another LLM on every turn

- [ ] Generate mixed-script Hinglish directly as above. `prepareSpeechText` normalizes NFC, whitespace and markup only; it must not run heuristic whole-sentence transliteration that corrupts names. Display the same understandable text that is actually synthesized. If a Roman-only display option is later added, keep it outside the critical audio path.
- [ ] Keep Simran first. Explicit TTS config: model bulbul:v3, speaker simran, pace 1.0, temperature 0.45, speech_sample_rate 24000, output_audio_codec wav. No pitch/loudness/preprocessing flags copied from v2.
- [ ] Resolve vendor's language-field discrepancy with one short contract probe at Task 10: try documented `language_code:"hi-IN"` first. Only if validation rejects that field, test existing `target_language_code:"hi-IN"`. Record HTTP status and successful field, lock that field in one adapter, never retry a whole synthesized conversation with both. Current adapter works in user's tests, so do not diagnose it broken without evidence.
- [ ] Validate TTS response has nonempty audio, valid RIFF/WAVE chunks and a supported format before forwarding. Keep decoding at native output context rate. Parse RIFF chunk bounds; truncated fmt/data must fail cleanly.
- [ ] Add optional server-only `SARVAM_TTS_DICT_ID`. Send `dict_id` only when configured. Dictionary creation is a separate one-time operation using official JSON `{pronunciations:{"hi-IN":{...}}}` contract. Add only words actually heard failing in the short listening test. No made-up dictionary ID and no per-turn dictionary upload.
- [ ] Add abort signals and 12s timeout to chat, 10s to REST TTS. At most one retry of 429/503 respecting a bounded Retry-After if the turn is still current; no retry on authentication or validation errors. Errors must reach UI. `TTS_MODE` must report `rest` until a WS implementation is actually invoked. Label degraded STT as typed fallback, not functioning REST transcription.

### Turn controller and playback

- [ ] `turn-controller.ts` owns one current generation ID and AbortController. On a new confirmed user utterance: cancel stale reply generation, append/update user turn, start exactly one generation with a snapshot of history. On VAD start while speaking, immediately send `interrupt` for the active turn and stop playback; preserve safety matching of the user's audio.
- [ ] Use a 150ms final coalescing window for conversational reply generation, not for safety scanning. Two consecutive fragments within that period can share one user turn. Safety scans happen on every final immediately. A paused longer phrase still matches through the independent rolling window.
- [ ] Extend protocol: `interrupt:{turnId}`, `turn-end:{turnId}`, `turn-error:{turnId,code}`, and include `turnId` on typed requests/finals so browser does not add the same typed message twice. Keep legacy adapters only during migration; update both ends in the same release.
- [ ] `AudioPlaybackQueue` serializes async decoding using a promise tail, holds scheduled sources in a Set, exposes `stopTurn(turnId)` and `stopAll()`. On stop, cancel sources and invalidate pending decodes through a generation counter so a late decode cannot start canceled speech. Reset playhead to audio clock and prevent negative pending count. Close contexts on teardown.
- [ ] Mark first-audio metric at actual scheduled playback start, not WebSocket receipt. A reply frame is not speaking. Playback start/end drives `orbAudio.phase`; microphone activity/VAD drives listening. Incoming partials must not blindly replace speaking state if output still playing. Suppress speaker echo with existing echoCancellation and test on actual laptop; never disable all user detection during TTS because that would miss a real duress phrase.
- [ ] Dispose aborts chat/TTS, clears STT reconnect timers, closes the old STT handle, prevents double reconnect on error+close, flushes transcript window and prevents sends on dead socket. Queue only a bounded <=1s microphone preroll while STT socket connects; report overflow instead of growing memory forever.

Mocked tests: user interrupts mid-audio; two final events arrive before model completes; second answer resolves before first; canceled TTS resolves late; two audio decodes resolve out of order; opening present once; duplicate typed final; tool round with two IDs; STT error+close schedules one reconnect; long silence causes no additional chat/TTS requests. No constant canned filler loop.

## Task 7: Build a dimensional glass object that fits the canvas

**Files:** `components/orb/Orb.tsx`, `OrbScene.tsx`, `OrbStage.tsx`; create `orb-scene-config.ts`, `orb-geometry.ts`, `orb-geometry.test.ts`; modify `packages/ui/src/tokens.css`.

### Why the current rendering fails

Perspective projected half-height is `r / sqrt(d*d-r*r) / tan(fov/2)`. At home r=1.5*(260/320)=1.21875, d=4, fov=34deg, this is about 1.047. Anything above 1 clips. At size 320 the ratio rises to about 1.324. At size 44 the radius is reduced again and the orb becomes tiny. Increasing displayed size alone is not a fix.

| Before | After | Why |
|---|---|---|
| World radius depends on CSS pixels | World radius 1 for every placement | Same composition at 44px and 340px |
| Clipped dark ball with small colored fragments | Full silhouette, broad white reflection, pink upper and cyan lower refraction | Gives visible curvature and depth |
| Perfect sphere rotated | Subtle stable asymmetric surface plus moving scene lighting | Sphere rotation alone is almost invisible |
| Scale is controlled by GSAP and useFrame | One frame loop applies composed values | Prevents animation races |
| Flat outer ring pulses by phase | Internal light response follows measured audio | Motion indicates actual speech |
| Low-power mode turns glass into opaque pink plastic | Lower sample count and still glass lighting | Same material identity across hardware |

### Locked starting scene

- [ ] Radius 1, 96x64 segments on desktop, 48x32 on compact/low-power. Group at origin. Camera `[0,0,4.6]`, fov 34, near .1, far 30. Camera target `[0,0,0]`. World scale stays 1. Initial projected sphere occupies about 73% of canvas, leaving room for motion and glow. Maximum deformation+scale stays under 1.055 radius; verify >=12% clearance per side at max amplitude.
- [ ] Home canvas CSS box `clamp(240px, 32vw, 340px)`, square aspect ratio. Header keeps 44px box with same world framing. No `size/320` geometry multiplier.
- [ ] Create geometry once in `useMemo`, displace each original unit vertex radially by `1 + 0.008*sin(3*x+1.2*y)*sin(2.7*z-.4) + 0.004*cos(4*y-1.7*z)`. Compute vertex normals once. Bound silhouette variation to 1.2%; do not rebuild geometry every frame. Dispose once on unmount. No jagged noise, spiky peaks or camera wobble.

```ts
import * as THREE from "three";
export function createOrbGeometry(compact = false) {
  const geometry = new THREE.SphereGeometry(1, compact ? 48 : 96, compact ? 32 : 64);
  const p = geometry.attributes.position;
  for (let i=0; i<p.count; i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const k=1+0.008*Math.sin(3*x+1.2*y)*Math.sin(2.7*z-0.4)
      +0.004*Math.cos(4*y-1.7*z);
    p.setXYZ(i,x*k,y*k,z*k);
  }
  p.needsUpdate=true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
```

- [ ] `MeshTransmissionMaterial` starting values: transmission 1, roughness .075, ior 1.46, thickness .9, backside true, backsideThickness .22, samples 6, resolution 384, backsideResolution 256, chromaticAberration .012, anisotropicBlur .035, distortion .018, distortionScale .45, temporalDistortion .018, attenuationDistance 4, envMapIntensity 1.2, clearcoat 1, clearcoatRoughness .06. These are tunable visual starting values, not proven final appearance. No effect composer initially.
- [ ] Add CSS tokens `--orb-white:#fff9ff`, `--orb-tint:#f1ddf4`, `--orb-violet:#a780e8`, `--orb-ground:#060609`; reuse pink/cyan. Resolve CSS hex strings using getComputedStyle once after mount and pass into scene config. Keep non-color numeric parameters in `orb-scene-config.ts`. Do not pass OKLCH strings directly to THREE.Color.
- [ ] Lighting: environment cube resolution 256, fixed background false. White upper-left rectangular Lightformer at [-3,2.5,3], size [2.5,4,1], intensity 3.0. Thin white right rim at [3,.4,1.5], size [.6,3,1], intensity 1.8. Broad muted pink upper/back panel at [0,3,-2], size [4,2,1], intensity 1.2. Cyan lower/back panel at [0,-2,-2], size [3,1.5,1], intensity 1.1. Orient each light card toward origin; verify normals rather than guessing Euler angles. Omit the full purple ring light that reinforces the flat ring silhouette.
- [ ] Add two soft, physically positioned color forms as scene siblings of shell: flattened translucent ellipsoids at `[0,.35,-.25]` scale `[.62,.4,.2]` and `[.1,-.38,-.1]` scale `[.55,.25,.16]`. Opacity <=.10, no saturated opaque core. The shell must refract these; do not parent them under the host transmission mesh, which drei removes from its capture pass. If they still look like separate disks, remove them and retain only environment lighting, then record failed comparison rather than piling on bloom.
- [ ] Keep environment PMREM static by default. Use slowly moving scene color forms for depth cues; animate environment only if measured performance permits, since a static captured environment will not reflect later Lightformer transforms unless recaptured. Do not write transforms to static captured lights and claim they animate reflections.
- [ ] Use a subtle ground contact shadow at y=-1.22, scale 3, far .5, opacity .12. It is a shadow, not a mirror reflection. Omit if framing makes plane edge visible. Avoid full-screen bloom and CSS border ring.
- [ ] DPR cap 1.5 desktop, 1 compact. Compact material samples 3 and resolution 128; low power can disable backside but keeps studio environment. Reduced motion freezes motion, not material identity. Handle WebGL unavailable/context lost with a deliberate static fallback and no infinite loading.

Geometry tests: maximum radius <=1.0121; finite positions/normals; disposed cleanly; camera-framing formula remains below .8 with max scale; compact and large variants use same world radius. Visual acceptance still requires Chrome screenshots and motion review; passing geometry tests alone does not establish realism.

## Task 8: One entrance, one centered orb, real speech motion

**Files:** `app/page.tsx`, `OrbStage.tsx`, `OrbScene.tsx`, `Orb.tsx`, `OrbAssembly.tsx`, `useReducedMotion.ts`, `lib/audio/levels.ts`, `CallHeader.tsx`; create `useOrbReadiness.ts` if readiness logic exceeds 50 lines.

- [ ] Remove full-screen `OrbAssembly` usage and its separate canvas. Delete the unused component after references are removed. Latest user rejected the assembly intro; do not restore flying fragments or particles. Keep a single home OrbStage mounted before and after reveal.
- [ ] Framer Motion owns only DOM opacity and a tiny translate. R3F owns scene transforms and audio response. If GSAP remains, it may tween a scalar `introProgress` ref with cleanup, never `mesh.scale` or another property also written by useFrame. More libraries do not create better motion.
- [ ] Scene readiness callback occurs once after environment is available and at least two rendered frames have completed; Canvas onCreated alone does not mean shaders finished. Start visual reveal from readiness, not a 1900ms timer. An 1800ms watchdog shows fallback and leaves controls usable if WebGL fails.
- [ ] Reserve geometry space from first paint. On first visit fade orb opacity 0 to 1 over 500ms, translate y from 6px to 0, scale .97 to 1 at most. Surrounding headline/composer fade over 220ms with 60ms offset after orb begins. Never block call actions behind a splash overlay. Subsequent page visits use 180ms opacity or no entrance. Reduced motion uses <=120ms opacity only; no transform or pulses.
- [ ] Home structure: outer `min-h-dvh`, app bar fixed height in normal flow, main flex column `max-w-[760px]`, hero `flex-1 grid place-items-center`, composer normal/sticky bottom with safe-area padding. Hero content is a centered grid with orb and text separated by 20px. Remove absolute `32vh` placement. Horizontal center of orb equals main center within 2px at 390, 768, 1440 and 1920 widths. Vertical position follows available space, not full-page center when composer is present.
- [ ] Preserve restrained product copy. Recommended homepage heading: "A familiar voice. A quiet way to reach someone." Support line: "Talk naturally. Your chosen phrase starts a private alert to your trusted contacts." Retain a clearly labeled call action and Q&A composer. Do not revive deck KPI cards.
- [ ] Drive shimmer from actual audio envelope. Read mic RMS when listening and TTS RMS when speaking. Normalize with noise floor .008 and ceiling .12, clamp 0..1. These are initial calibration constants. Smooth with exponential attack .07s/release .28s, independent of frame rate. No rapid opacity flashing or randomized blinking.

```ts
const raw = analyser ? analyserRms(analyser) : 0;
const target = Math.max(0, Math.min(1, (raw - 0.008) / 0.112));
const tau = target > envelope.current ? 0.07 : 0.28;
envelope.current += (target-envelope.current)*(1-Math.exp(-delta/tau));
const a = envelope.current;
const idle = phase === "idle" ? 0.002*Math.sin(time*0.6) : 0;
group.scale.setScalar(1+idle+0.024*a);
group.rotation.y = 0.08*Math.sin(time*0.22) + pointerX*0.12;
group.rotation.x = pointerY*0.08;
// Compose these values here only; no separate GSAP tween of group.scale.
```

- [ ] During speech, move internal light form y by <=.025*a and vary opacity by <=.035*a. Listening biases upper pink, speaking lower cyan. Thinking uses slow light drift only. Reflection remains sharp, never strobe the whole sphere. Keep base silhouette round.
- [ ] Use one explicit phase source: OrbStage receives phase and feeds scene; remove disagreement between prop phase and stale global orbAudio.phase. Clear global audio references on teardown. During actual scheduled TTS playback keep speaking even if an interim transcript arrives, unless interruption stopped output.
- [ ] On quiet mic for two seconds the orb returns to idle/listening stillness. On playback end it releases over 280ms. In reduced motion keep a static color state with no scale or pointer motion. Remove alarm shock tween and repeating outer halo.
- [ ] Freeze decorative motion when document hidden, but never pause microphone, relay, alert dispatch or audio because WhatsApp is foreground. Use bounded delta on resume to avoid a visual jump. Make low-power quality depend on measured performance or explicit quality flag, not solely hardwareConcurrency.

Visual QA matrix:

| Case | Pass criteria |
|---|---|
| Cold load with cache disabled | No blank blocking screen, no canvas swap, no clipped sphere |
| Reload after intro seen | No particle/assembly replay |
| Slow JS/WebGL | Controls usable; reserved box prevents layout shift |
| Pointer left then right | Specular/refraction changes across curved glass, no canvas-plane tilt |
| Silent mic | No fake constant talking pulse |
| Recorded synthetic audio fixture | Envelope changes with amplitude, max scale bounded |
| Real Maa reply | Highlight motion follows actual audible speech |
| 44px call header | Sphere fills about 70-75% of stage, not a tiny center dot |
| Reduced motion | Same glass appearance, no continuous transforms |
| Tab hidden/restored | Voice continues, animation resumes without jump |

Do not declare final visual approval from one screenshot. Compare fixed resting frames and a short motion capture against user's glass sphere references. Keep all screenshots free of private recipient data.

## Task 9: Make tests reflect the system, not just the utility functions

**Files:** `.github/workflows/ci.yml`, root and bridge `package.json`, web/relay/core test files listed above; create `docs/DEMO-RUNBOOK.md` and `docs/TEST-MATRIX.md`.

- [ ] Add bridge script `"test":"node --test *.test.js"`. Import bridge app without binding a production port. Put listener only in server.js. Inject desktop/store dependencies for app tests.
- [ ] Root test command becomes `pnpm --filter @pukaar/core test && pnpm --filter @pukaar/relay test && pnpm --filter @pukaar/web test && pnpm --filter @pukaar/wa-bridge test`. Add actual web tests before including it so Vitest does not fail on zero tests.
- [ ] Use web's existing node Vitest environment for pure orchestration/API functions. If testing React hooks, add `@testing-library/react` and jsdom as web dev dependencies, mark only hook test files with jsdom environment, and mock geolocation/audio/fetch. Lockfile update required. Do not use real Firestore credentials in CI; inject repository interfaces or run Firebase emulator for transaction concurrency tests.
- [ ] Test idempotency in the actual Firestore emulator: two simultaneous alarm transactions create one primary alert and one bridge job; duplicate acceptance HTTP remains one job; unknown Enter result cannot retry automatically. Unit mocks alone do not prove transaction behavior.
- [ ] CI has no Sarvam or WhatsApp requirements. Test public-origin parsing against safe fixture env. Add bridge tests on Ubuntu with fake adapter; real Windows smoke remains an explicit local step.
- [ ] Run each command and record real result, not assumed pass:

```powershell
pnpm --filter @pukaar/core test
pnpm --filter @pukaar/relay test
pnpm --filter @pukaar/web test
pnpm --filter @pukaar/wa-bridge test
pnpm typecheck
pnpm lint
pnpm build
pnpm doctor
```

Required fault matrix includes: bridge down; WhatsApp closed; clipboard locked; wrong secret; invalid phone; no recipient selected; composer mismatch; lost focus; duplicate trigger; split final; Devanagari partial; missing location; upload rejected; Firestore offline; expired read link; TTS rejection; mic denied; turn cancellation; network drop while Enter might have executed; browser close mid-job. Every row records expected UI state, expected Enter count and retry eligibility.

## Task 10: Minimal-credit live evaluation and release

No provider calls were made by the planning audit. Future execution has this budget by default, with actual usage recorded and stop conditions respected:

1. At most two short TTS contract requests total to resolve the language-field discrepancy. Use text `हाँ, ठीक है. कल वाली meeting कैसी रही?`. Do not run both variants if the first succeeds.
2. At most four additional TTS samples, each <=120 characters, to compare Roman input against mixed script and one pace change. Keep same speaker to isolate text effects before changing voice.
3. One Hinglish call <=90 seconds and <=6 model turns. After capture, repeat playback from local recording instead of calling API again. Recordings are temporary, gitignored and require the user's consent if recording their voice; synthetic TTS-only fixtures need no personal audio.
4. Stop on 401/403 or repeated 429/5xx. Do not run retry loops that spend credits. Never synthesize a sound file for every visual iteration; use a local oscillator or prerecorded nonsensitive amplitude fixture.

Suggested live conversation, with one sentence per turn:

| User | Verify |
|---|---|
| Hi Maa, aaj college mein presentation tha | Opens and responds in Hinglish, not generic assistant greeting |
| Achha gaya, bas thoda nervous thi | Refers to presentation and nerves, not unrelated stock question |
| Nahi, presentation kal hai, aaj practice thi | Accepts correction and remembers practice |
| Wait, ek second, meri baat suno | Stops old audio promptly, does not speak two replies at once |
| Papa ko bol dena blue notebook | Stores first phrase fragment, does not submit yet |
| drawer mein rakhi hai | Recognizes completed distinctive clause, submits one alert |

Score naturalness with observed notes, not fabricated accuracy percentages: contextual relevance, mixed-language fluency, correct names/words, non-repetition, interruption behavior and no spoken alert disclosure. Five-point rubric for each: 1 unacceptable, 3 usable with obvious flaws, 5 natural in this sample. Require no dimension below 3 and no disclosure, but label scores subjective, sample-limited.

- [ ] Before any live WhatsApp send, identify the consenting recipient and exact test purpose. Message starts `PUKAAR TEST: No emergency.`. Specific personal location disclosure goes only to the user-approved destination. Do not send to an arbitrary saved contact for convenience.
- [ ] In Chrome use localhost setup with test mode. Confirm actual phrase profile, Maa identity, persisted location freshness, bridge ready/version 2 and public tracking URL. Keep WhatsApp already signed in in background.
- [ ] First use non-sending profile preview. Then the one approved call above. Confirm distinct timestamps for detected, queued, preparing, submitting, submitted and foreground restored. Open public link in incognito or another device and verify coordinate/time match the persisted snapshot. The direct Google Maps URL is a snapshot, not continuously updating live location.
- [ ] If a link says expired after six hours, create a new session. Do not disable expiry for a successful demo. If no point exists, tracking must explicitly say so; do not insert demo coordinates into real-user state.
- [ ] Capture bridge submitted result and check actual WhatsApp conversation manually. Preserve the difference between submitted and delivered even if one test shows delivery ticks.
- [ ] Test bridge-down and upload-failure paths with mocks again after visual changes. Voice and alert tests must not depend on orb readiness or canvas visibility.
- [ ] Update README/architecture/runbook with exact current behavior and limitations. Remove claims of offline browser recognition, TTS streaming if unused, and guaranteed delivery. Document startup, known error labels, retry rules and public origin.
- [ ] Verify owner through `gh auth status` and `gh api user --jq .login`. Use the configured owner-authenticated commit workflow, no coauthor trailer. Verify diff excludes `.env`, `.state`, logs, private recordings and bearer tokens. Push through the authorized repository workflow and check GitHub Actions.
- [ ] Deploy only web changes to existing Vercel project after all gates. Preserve canonical domain and shared Firestore project. Check public health plus a real test-session tracking stream; health alone cannot establish tracking works. Restart only changed local relay/bridge services between calls, never mid-call.

## Likely implementation traps and exact responses

| Symptom | Cause to check first | Required response |
|---|---|---|
| Bridge healthy but refuses every alert | Leaked worker lock or queued unknown job | Show queue state; fix finally; do not kill unrelated processes |
| Trigger toast appears, no WhatsApp movement | Detected state reached but acceptance/dispatch failed | Inspect alertId stages and typed error, not model prompt |
| Duplicate messages | Separate IDs, regenerated retry body, timeout retry after Enter | Stable alertId/body; unknown result never auto-retry |
| Text matches Roman but not Hindi | Missing native aliases; partial mode differs from final | Shared profile alias groups and separate rolling windows |
| Papa variation fails despite old test passing | Actual STT output differs or configured place is kitchen | Compare local normalized rule result without logging transcript publicly |
| Long phrase split loses detection | Final-only single-fragment scan | Rolling final window before model generation |
| Wrong-color sentence triggers | Old fuzzy matcher still used in a trigger path | Remove bypass; require all distinctive anchors |
| Not located on public page, located in inspector | Local capture displayed before upload acknowledgment | Show sync state; validate HTTP and server point |
| Stale position called current | Date.now used instead of position timestamp | Preserve pos.timestamp and freeze snapshot label |
| Tracking waits forever | Firestore failure swallowed or SSE errors ignored | Retry state then bounded error; permanent terminal closes |
| Call ended but tracker remains active | Navigation without end API | Shared handleEnd stops voice immediately and ends cloud session |
| New speech overlaps old reply | Unserialized chat/TTS or late audio decode | Generation token, abort and playback stopTurn |
| Mispronounced Hindi | Roman text ambiguity or named word | Mixed-script synthesis; dictionary only for observed failures |
| TTS 400 after cleanup | language field/API version or v2-only flag | Locked contract probe; never send both guessed fields |
| Orb clipped or square-looking | Projected sphere larger than canvas | Unit radius and fixed camera; max amplitude clearance test |
| Orb visually still despite rotation | Rotational symmetry or static environment capture | Subtle geometry asymmetry and visible refracted forms |
| Call orb is tiny | CSS size also scales world geometry | Remove double shrink |
| Shimmer fights pulse | GSAP and frame loop write same transform | Single transform owner |
| Abrupt entrance remains | GPU not ready or second canvas swap | Readiness callback plus one persistent scene |
| WebGL makes call sluggish | Extra capture passes/large DPR | Lower samples/resolution, freeze hidden visuals; keep audio alive |
| Reduced-motion still bounces | Separate CSS halo or intro ignores preference | One shared preference, no transform animation |
| Clean CI passes while bridge broken | Bridge/web tests excluded | Root test includes all four suites |

## Final acceptance checklist

- [ ] All user-specified prefix/caller/short-clause/split-sentence cases covered.
- [ ] Distinctive color/object/place substitution does not silently trigger.
- [ ] Detected is never represented as submitted.
- [ ] Every bridge failure releases queue and returns an observable result.
- [ ] No duplicate/unknown-result auto-send.
- [ ] Public tracking and Maps link verified with acknowledged coordinates.
- [ ] Maa persona, contextual Hinglish and interruption verified in limited sample.
- [ ] Hindi pronunciation improved based on actual listening, not assumed from text.
- [ ] Orb silhouette fully fits, dimensional reflections move, audio response is genuine.
- [ ] Home horizontally centered; intro does not swap canvases or block controls.
- [ ] No unwanted particle entrance, alarm shock or fake continuous speaking animation.
- [ ] Core, relay, web and bridge tests included in CI and pass.
- [ ] New docs contain no private keys, contact data or em dashes.
- [ ] Completion report distinguishes completed checks from remaining platform limitations.

## Handoff rule

Each task produces a short execution note: files changed, commands run, actual results, remaining uncertainty. Do not mark a task complete because code compiles if its stated behavior has not been checked. If a vendor parameter or Windows interaction differs from this plan, capture the minimal failure evidence and fix that boundary; do not redesign the product or change providers without necessity.
