# SwipeVerse — Handover / Status

_Last updated: 2026-07-04_

## Where things stand

Everything below is live and pushed:

- **Site deployed via GitHub Actions** on every push to `main`:
  - Landing page: https://retroverse-studios.github.io/swipeverse/
  - Game (PWA): https://retroverse-studios.github.io/swipeverse/app/
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

1. **DNS for swipeverse.app** (in flight, 24–48 h). When it resolves:
   - Repo Settings → Pages → Custom domain → `swipeverse.app` (+ enforce HTTPS).
   - Then flip one line in `.github/workflows/deploy.yml`:
     `PAGES_BASE: /swipeverse/app/` → `/app/` (or ask Claude).
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
4. **Review the landing page copy** (`landing/index.html`) — placeholder
   quality by design; edit freely or leave for the design refresh.
5. **Store go-live decision** — say the word to create
   `retroverse-studios/swipeverse-store` on GitHub (public), then Pages +
   `store.swipeverse.app` CNAME.
6. **Update retroverse.studio** — point its SwipeVerse link at swipeverse.app
   once the domain is live. (Old `swipeverse.app` site repo: you're deleting it.)

## To-do queue (Claude can do any of these on request)

| Task | Size | Blocked on |
|---|---|---|
| Flip `PAGES_BASE` after custom domain attached | one line | DNS (#1) |
| Regenerate starter decks with archetype tags | one command + API cost | your go (replaces unplaytested decks) |
| Proper PNG manifest icons (192/512) — makes PWA install bulletproof, better home-screen icon | small | icon artwork choice (diamond stopgap OK) |
| Process the 4 missing archetype scenes into `public/cards/` + update `CARD_ART` placeholders | small | art (#3) |
| **Design refresh** — 3–4 radically different visual directions for the game shell + landing, pick one, implement; produces itch.io assets (cover, screenshots, gif) | session | nothing — ready when you are |
| Store go-live: create GitHub repo, enable Pages, wire `services/apiService.ts` to the real catalog (keep samples as offline fallback), remove Demo badge | medium | #5 |
| Publish on itch.io | small | playtesting + design refresh |
| Post-launch: multiverse portals/sagas (schema design done in principle — see chat/roadmap), "My Artwork" library (IndexedDB), per-reality palette variants of card art | later | launch |

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
