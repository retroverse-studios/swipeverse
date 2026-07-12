# SwipeVerse — Handover / Status

_Last updated: 2026-07-12_

## Latest session (2026-07-12): pre-launch audit + full store catalog

- **Full go-live audit passed**: game loop, editor, art picker (bundled +
  store palette), AI generation, series chaining, store integration, PWA —
  all wired; typecheck/lint/build clean; live URLs healthy.
- **Editor fixes shipped**: "To Library" button in the Deck Editor toolbar
  (decks can now enter My Library from the editor), "AI Settings" button in
  the Story Director panel (was a dead-end toast), "Next in the series" now
  only offered after a win, removed dead esm.sh importmap + 404ing
  /index.css link from index.html.
- **Store catalog is now REAL content** (was: two 1-2 card stubs). Live at
  store.swipeverse.app: 20 game realities (one per hosted art set, cards
  art-bound to their set), 3 educational realities, 2 three-part sagas
  (The Hollow Crown / kingdom, Ashfall / postapoc — first content to
  exercise series chaining). Every deck passed the winnable-AND-losable
  solver gate at all difficulties.
- **Educational naming scheme now documented** at
  `docs/educational-naming.md` (Reality = the world, e.g. "The Perimeter";
  Deck = the pressure point, e.g. "Zero Hour"). Shipped names (The
  Founder's Gambit, Zero Day: Breach Protocol, Merge Conflict) predate it —
  the doc maps each to its future rename. Zero Day rides the *science* art
  set until Michael's Cybersecurity set lands (swap = artSet in the
  generator spec + regenerate or sed the URLs).
- **Generator**: `node scripts/generate-store-catalog.mjs [id…]` (needs
  ANTHROPIC_API_KEY). Stages per-deck JSON in scripts/store-out/ (resumable;
  delete a staged file to force regeneration), assembles both catalog files,
  playability-gates everything. Michael is producing Noir + Cybersecurity
  art sets; when they land: publish set to store art/, add a spec to
  REALITY_SPECS, run the generator for that id.
- **Remaining before "live"**: playtest a sample of the new decks (all are
  machine-checked, none human-played), install-test PWA on a phone,
  enforce-HTTPS check, itch.io publish.

## Agreed order of work

1. ~~DNS → custom domain → base flip → PNG icons~~ ✅ done (2026-07-05)
   → **install-test on a phone** (remaining bit of step 1)
2. ~~Art pieces~~ ✅ delivered big: 24 complete themed sets (9 scenes + back +
   4 badges each). Tooling, originals, and masters live in the private
   **swipeverse-art** repo (local: `../art`). base+cyberpunk+mystical+space
   are bundled and wired; the other 20 sets are **store art palette** content
   — publish with the store repo, then surface in the deck builder's art
   picker so community creators can use them.
   Remaining from step 2: regenerate starter decks with tags → playtest
3. Design refresh (full art set in hand; produces itch.io assets)
4. ~~Store~~ ✅ LIVE end-to-end (2026-07-11): store.swipeverse.app — catalog +
   styled index + Creator Guide + 20-set art palette (in the deck builder
   picker); app fetches live catalog w/ offline fallback; menu has a
   "New from the store" shelf
5. Publish on itch.io

## Where things stand

Everything below is live and pushed:

- **Site deployed via GitHub Actions** on every push to `main`:
  - Landing page: https://swipeverse.app/
  - Game (PWA): https://swipeverse.app/app/
  - DNS: Cloudflare, non-proxied, apex A records + www CNAME to GitHub Pages.
    Custom domain registered on the repo; enable "Enforce HTTPS" in
    Settings → Pages once the certificate shows as issued.
- **Three bundled starter decks** (`decks/*.json`) — the game is playable with no
  AI key, offline. Machine-generated, balance-checked, **not yet playtested**.
- **Card archetype system** — 9 archetypes drive default pixel-art card scenes
  (`public/cards/`); editor has an archetype dropdown + art picker per card.
- **Deck library** — "My Library" tab in the store screen; store adds never
  overwrite; export/import to disk as backup.
- **AI layer** — multi-provider (Gemini/OpenAI/Claude/Ollama), validated deck
  output, real error surfacing with retry, keys only injected in dev builds.
- **Store project** — `../swipeverse-store` (separate repo, LOCAL ONLY, no
  GitHub remote yet): catalog JSON, CI validator, contribution/content policy.
- Architecture and content-policy decisions are recorded in `README.md` →
  Roadmap. Don't relitigate them; amend them there if plans change.

## Waiting on Michael

1. ~~DNS / custom domain / base flip~~ ✅ done. Remaining: enable
   "Enforce HTTPS" in Settings → Pages once the cert is issued, and
   **install-test the PWA on your phone** (icons are now proper PNGs).
2. **Playtest the starter decks** — recommended: regenerate first with
   `npm run generate:decks` (needs `ANTHROPIC_API_KEY`) so you playtest decks
   that carry archetype tags; the current bundled ones predate the tagging.
3. **Four missing archetype art pieces** — generate in the same pixel style as
   the existing set (same tool/settings as the avatars), then hand to Claude
   for processing. Prompts:
   - **faction** — "A group of three imposing figures standing shoulder to
     shoulder beneath a large heraldic banner, viewed from below, unified and
     faceless"
   - **advisor** — "A hooded figure in profile leaning close to whisper, one
     hand raised beside their mouth, a sealed scroll tucked under the other
     arm, candlelit"
   - **gamble** — "Two oversized dice tumbling mid-air above an outstretched
     open palm, coins scattered and frozen mid-bounce, dramatic single light
     source"
   - **terminal** — "A cracked crown lying on stone steps in rain, dark
     spilled liquid pooling beneath it, a single shaft of cold light"
   - Style suffix for all: _16-bit pixel art, flat colors with subtle texture,
     landscape 3:2, moody two-tone palette, no text_
4. **Review the reskinned landing page** (Tarot palette + shells section,
   commit "Reskin landing page"). Hate it? `git revert` that one commit
   restores the old page exactly.
5. ~~Store go-live~~ ✅ live: github.com/retroverse-studios/swipeverse-store,
   catalog served via Pages, app wired with offline fallback. Remaining on
   you: add Cloudflare CNAME `store` -> `retroverse-studios.github.io`
   (grey cloud), then tell Claude to attach the domain + flip CATALOG_BASE.
6. **Update retroverse.studio** — point its SwipeVerse link at swipeverse.app
   once the domain is live. (Old `swipeverse.app` site repo: you're deleting it.)

## To-do queue (Claude can do any of these on request)

| Task | Size | Blocked on |
|---|---|---|
| Regenerate starter decks with archetype tags | one command + API cost | your go (replaces unplaytested decks) |
| Redo manifest icons with real artwork (current: rasterized diamond stopgap) | small | design refresh |
| Process the 4 missing archetype scenes into `public/cards/` + update `CARD_ART` placeholders | small | art (#3) |
| **Design refresh** — plan at `docs/design-refresh-plan.md`: direction mockups → pick → shell → card chrome + juice (deal-in, flip, drag stat-preview, meter feedback) → itch.io assets | session(s) | mockups ready anytime; final art improves them |
| Store art palette: publish the 20 non-bundled themed sets (from `art-processed/`) to the store site; extend the editor's art picker with a store-palette source; allowlist the store host in the validator | medium | store go-live |
| Publish on itch.io | small | playtesting + design refresh |
| Editor: AI co-writing verbs (rewrite this card, add N cards in this style, fill in effects, continue from card X) — AI as collaborator, not just whole-deck drafter | medium | post-launch |
| Post-launch: card-level multiverse portals across realities (deck-level series chaining SHIPPED 2026-07-11 — "Next in the series" at game over), "My Artwork" library (IndexedDB), per-reality palette variants of card art | later | launch |

## Quirks & commands

- **exFAT drive**: macOS recreates `._*` AppleDouble junk constantly. Git and
  ESLint ignore them; if git ever errors ("non-monotonic index"), run
  `find . -name '._*' -delete` from the repo root. Goes away when the project
  moves to an APFS drive.
- `npm run dev` — local dev (env keys from `.env.local` work here only)
- `npm run check` — typecheck + lint (CI-equivalent)
- `npm run generate:decks [realityId…]` — regenerate starter decks (Claude API)
- Deploys are automatic on push to `main`; watch with `gh run list`.
- Store validator: `node ../swipeverse-store/scripts/validate.mjs`
- Art set intake: copy a processed set to `../swipeverse-store/drop/<name>/`,
  then `node ../swipeverse-store/scripts/ingest-art.mjs [--publish]` —
  validates layout/WEBP/dimensions, installs to `art/`, updates the index.
