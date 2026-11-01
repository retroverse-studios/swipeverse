# SwipeVerse — Full Code Audit

Date: 2026-11-01 · Scope: app (`swipeverse`), plus a light pass over
`swipeverse-store` (catalog validator + live data) and `swipeverse-art`
(tooling). Baseline: `npm run check` (tsc + eslint) clean, `npm run build`
clean, **no test suite exists**. Store catalog validates
(`node ../swipeverse-store/scripts/validate.mjs`: 8 decks, 25 realities OK).
Live: landing, `/app/`, and store catalog all 200.

Severity: **High** = broken/misleading core behaviour or real exposure ·
**Medium** = wrong results, divergence, missing wiring ·
**Low** = dead code, polish, defence-in-depth.

---

## High

### H1. `validateAndRepairDeck` silently strips stat branches (and deck metadata)
`sanitizeChoice` (`services/aiProvider.ts`) rebuilds each choice with only
`text`, `effects`, `nextCardIndex`, `soundUrl` — **`branches` is never
copied**. Every AI-generated deck (`generateInitialDeck`,
`generateBranchingDeckFromPrompt`), every `?play=` link deck, and every
bundled starter deck passes through this validator, so the
stat-conditional branching the prompts explicitly ask the AI to write
("a ruler with Wealth >= 60 is received at court…") is deleted before play.
The engine, editor, visual editor, and both solvers all support branches —
only the validator kills them. The same pass also drops `deck.series`,
`deck.category`, and `deck.source` from the returned object, so a
play-linked saga chapter can't chain to its next part.
Fix: sanitize-and-keep `branches` (validate stat name, clamp bounds 0–100,
require ≥1 bound, in-range target); preserve `series`/`category`; when
cards are dropped, strip branch targets too (indices shift, same as
`nextCardIndex` today); add tests.

### H2. Production styling depends on the Tailwind CDN Play script
`index.html` loads `https://cdn.tailwindcss.com` + an inline
`tailwind.config`, Google Fonts, and React Flow CSS from `esm.sh`. Consequences:
- No CSP is possible (inline config script, runtime style generation).
- The "install and play offline" PWA promise depends on the service worker
  having cached opaque CDN responses; a first visit needs three third-party
  hosts up.
- Tailwind Play CDN is explicitly not for production (FOUC + runtime cost).
Fix is non-trivial because reality `colors` are Tailwind class *strings*
that also arrive at runtime from the store catalog / imported files — a
built Tailwind would purge unseen classes. Options: (a) built Tailwind
(v3 PostCSS) with content scanning + a safelist for the colour-class
patterns realities use; (b) migrate reality colours to inline style values.
Decision needed. The React Flow CSS and fonts can be bundled regardless
(`reactflow` is already an npm dependency; use `@fontsource`).

## Medium

### M1. Editor imports and fetched decks bypass validation entirely
The editor's deck import and "import all realities" accept any JSON with a
`cards` key / array shape and store it verbatim; `deckUrl` fetches and
store-catalog payloads are likewise cast, not validated. A malformed import
(effects as strings, missing `statNames`) persists to localStorage and can
crash `GameScreen` render or produce `NaN` stats that never trigger
game-over. Inconsistent with the AI path, which over-validates (H1).
Fix: route deck imports through the (fixed) `validateAndRepairDeck`;
validate imported realities field-by-field with defaults; validate
localStorage loads the same way (M3).

### M2. Game-over turn count is off by one
`handleSwipe` calls `setTurnCount(prev => prev + 1)` and then, on the
ending swipe, `handleGameOverWithSound` closes over the *previous*
`turnCount`. Every recorded game (history, achievements like Speed Runner
≤15 / Survivalist ≥20, avg-turns stats) undercounts by one turn.
Fix: compute `const turns = turnCount + 1` locally and pass it through.

### M3. Unvalidated localStorage deserialization throughout
`realities`, deck library, history, and AI settings are `JSON.parse`d and
cast/spread without shape checks (`App.tsx`, `services/gameHistory.ts`,
`services/aiService.ts`). Corrupt or older-schema data can white-screen
render (e.g. a reality missing `statNames` reaches `GameScreen`). The
prologue/shell-theme loaders in the same codebase already do this properly.
Fix: per-entry validators with drop-or-default semantics.

### M4. No tests at all, and CI is deploy-only
There is no test script; the pure logic that most needs pinning —
`validateAndRepairDeck`, `resolveNextIndex`, `deckSolver`,
`applyDifficultyModifier`, `buildLinkedReality`, achievement evaluation —
has zero regression coverage (H1 would have been caught by one test).
`deploy.yml` builds but never runs `npm run check`, so a lint/type
regression deploys silently. Fix: add Vitest with focused unit tests for
the services above; run `check` + tests in CI before deploy.

## Low

### L1. Dead icon system remnant
`Reality.statIconNames` + `components/icons.tsx: iconRegistry` are written
in constants/editor/apiService/playLink but never rendered anywhere —
stat badges are art files now (`statBadgeFor`). Make the field optional and
stop writing it, or remove end-to-end (stored realities keep the field
harmlessly).

### L2. Service-worker cache versioning is manual
`CACHE_NAME = 'swipeverse-v3'` in `public/sw.js`; cache-first for bundles is
safe (hashed names), but unhashed assets (CDN scripts, `/cards/*.webp` art
swaps) only refresh when someone remembers to bump the version. Tie the
cache name to the build (stamp at build time) or move to a generated SW
when H2 is tackled.

### L3. `AudioContext` created at module scope
`GameScreen.tsx` constructs a shared `AudioContext` at import time; browsers
start it `suspended` (autoplay policy) and log a warning. Sounds silently
no-op until a gesture resumes it — game-start sound often won't play.
Fix: create/resume lazily inside `playSound`.

### L4. Unnecessary `export` surface
`randomSurvival` (used internally), `branchMatches`, `STORE_SUBMIT_URL`,
`loadHistory`, `loadAchievements`, `calculateStats`, `DIFFICULTY_MODIFIERS`
are exported but only used inside their own module (or, for
`calculateStats`/`loadHistory`, by `GameOverScreen`/`MainMenu` via
re-check — verify before unexporting). Minor API hygiene.

### L5. Difficulty scaling note (design, not a bug)
`applyDifficultyModifier` scales gains and losses symmetrically (easy =
70% of every swing). That's a coherent "slower drift" model, but players
may read Easy as "losses hurt less" while gains also shrink. Document on
the difficulty picker, or scale only movement away from 50. Solver and
game agree either way.

### L6. Landing also depends on Google Fonts
`landing/index.html` loads the same webfonts from Google. Fold into the H2
work (self-host via fontsource or the zip download).

---

## swipeverse-store / swipeverse-art (light pass)
- Store validator passes on the committed catalog; live catalog serves 200;
  no stat branches used in catalog content yet (validator supports them).
- Art repo is local Python tooling driving `limn`; no shell-injection smells
  found in a scan; full audit of 1,456 lines of pipeline scripts was out of
  scope for this pass.

## Verified good (checked, no action)
- Dev/prod key hygiene: `vite.config.ts` inlines provider keys **only** in
  development mode; production users bring their own (localStorage).
- No `dangerouslySetInnerHTML`; card/reality text renders via React.
- Validator's *other* repairs are sound: effects clamped to ±50,
  out-of-range jumps dropped, index-shift handling when cards are dropped.
- Solver/engine parity: `services/deckSolver.ts` and `GameScreen` share
  `resolveNextIndex` + `applyDifficultyModifier`; BFS winnable/losable with
  state cap; scripts mirror documented.
- SW deliberately never caches AI-provider traffic; catalog network-first.
- Prologue/seen-decks and shell-theme storage loaders validate input
  (the pattern M3 should follow).
- Store fallbacks: offline samples mean the store screen never hard-errors.
- Play-link decks are ephemeral (never added to the player's collection).

## Suggested fix order
H1 (+tests from M4 for the validator) → M2 → M1/M3 validation sweep →
M4 test harness + CI gate → H2 decision (may be its own project) →
L1–L6.

---

## Resolution (2026-11-01)

Fixed in this pass (user approved: everything incl. Low; built Tailwind):

- **H1** Validator now sanitizes-and-keeps `branches` (known stat, ≥1 bound
  clamped 0–100, in-range target), preserves `series`/`category`/`source`,
  and strips branch targets when card drops shift indices. Covered by the
  new test suite.
- **H2** Built Tailwind v3 (PostCSS) with content scanning + a safelist for
  the runtime colour-class patterns realities carry; custom CSS moved to
  `index.css`; React Flow CSS bundled from npm; fonts bundled via
  `@fontsource` (landing fonts self-hosted too, **L6**); strict build-time
  CSP injected (arbitrary-HTTPS `connect-src` remains, as scenario/deckUrl/
  provider endpoints require); SW registration moved out of inline script;
  SW cache name stamped per build (**L2**).
- **M1/M3** New `services/storageValidation.ts`; editor deck/reality
  imports, library file imports, `deckUrl` fetches, store catalog payloads,
  and all localStorage loads (realities, library, history, AI settings) are
  validated/sanitized at the boundary.
- **M2** Turn count computed synchronously on the ending swipe.
- **M4** Vitest added: 13 tests over the validator, branching, difficulty
  modifier, solver smoke, and play-link building. Deploy workflow now runs
  `npm run check` + `npm test` before building.
- **L1** Dead stat-icon system removed (`iconRegistry` + 12 icon
  components); `statIconNames` is now an ignored legacy optional field.
- **L3** AudioContext created/resumed lazily on first sound.
- **L5** Closed as by-design: the difficulty picker already labels the
  symmetric scaling ("0.7× effects").
- Bonus: `npm audit fix` cleared 3 advisories (1 critical) → 0.

Verification: `npm run check` clean · 13/13 tests · `PAGES_BASE=/app/`
build clean (CSP meta present, zero CDN references, safelisted classes
present, manifest path correct, SW cache stamped per build).

Follow-up (separate from this audit): store discovery UX — the store
screen's clutter, featured/popular surfacing, and education-vs-games
findability are being redesigned with the user next.
