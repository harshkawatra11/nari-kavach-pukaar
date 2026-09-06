# Working in this repository

Pukaar is a pnpm + Turborepo monorepo. Three deployable units (`apps/web`, `apps/relay`,
`apps/wa-bridge`) and two shared libraries (`packages/core`, `packages/ui`). Read
[README.md](README.md) first for the map of the stack and the architecture diagrams, then
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the backend deep dive.

## Hard rules for this repository

- **All commits are authored through the GitHub CLI (`gh`), authenticated as the repository
  owner's own GitHub account.** Never attach a "Co-Authored-By: Claude" (or any AI) trailer
  to a commit message or a pull request description in this repository. Every commit and PR
  must read as solely the owner's own work. This overrides any default agent commit-attribution
  behavior.
- **Zero em dashes** in any committed file — code comments, docs, commit messages, PR
  descriptions. Use a period, a comma, or a colon instead.
- No AI-voice phrasing ("here's the thing", "it's not just X, it's Y", rhetorical-question
  hooks). Write like a human engineer explaining a real decision.
- `packages/core` is framework-free, pure TypeScript, and every exported function has a
  colocated `*.test.ts`. Do not import React, Node built-ins beyond `crypto`, or either app
  into it.
- The design tokens in `packages/ui/src/tokens.css` are the single source of truth for every
  color and stroke width in the product. Never write a raw hex value anywhere else. The tokens
  are lifted directly from the pitch deck (`Pukaar_NariKavach_TeamIdeaForge.pdf`, Figma
  `gkR2Uy1VqcALtXNPgvmW8V`) so the shipped product and the deck stay the same object.
- `cornerRadius = 0` everywhere. `packages/ui/src/tokens.css` enforces this globally; do not
  add a component-level override.
- Sarvam AI model IDs currently valid: `sarvam-105b-conversations` (chat), `saaras:v3-realtime`
  (streaming STT), `bulbul:v3` (TTS). `sarvam-m` and `saarika:*` are deprecated and will fail.
  See `docs/ARCHITECTURE.md` for the full API contract.
- Never commit a GCP service account JSON key. Firestore credentials live only in
  `.env.local` (gitignored) as three separate env vars.
- `pnpm verify` (lint, test, build) must pass before any push to `main`. There is deliberately
  no standalone `typecheck` step in `verify` or CI: `next build` generates ambient route types
  as a side effect, so `tsc --noEmit` fails on a clean checkout before that build has run once.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes, APIs, conventions, and file structure may all differ from
your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from
this file's directory; in monorepos the `next` package may not be visible from the repo root)
before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`, verify at
`node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only
re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
