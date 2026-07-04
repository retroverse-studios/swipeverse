# Bundled Starter Decks

JSON deck files in this folder ship inside the app bundle, so the built-in
realities are playable without configuring an AI provider.

## Adding or updating a deck

1. Run the app (`npm run dev`) with an AI provider configured.
2. Open the target reality in the **Editor** and generate a deck with the
   **AI Story Director** (or hand-author one in the visual editor).
3. Playtest it — this deck is a new player's first experience.
4. Use the editor's per-deck **Export** button (it downloads
   `deck-<realityId>.json`) and drop the file here unchanged — both
   `deck-<realityId>.json` and plain `<realityId>.json` are accepted, where
   `<realityId>` matches the reality's `id` in `constants.tsx`
   (`cyberpunk`, `mystical`, `space`, ...).

The file may be a bare deck (`{ "name": ..., "cards": [...] }`), a single
reality object, or a full editor export array — the loader (`index.ts`)
finds the right deck, validates it, and tags it `source: "bundled"`.

## How bundled decks behave in the app

- **No AI configured** → the bundled deck plays, so the game works with
  zero setup.
- **AI configured** → a fresh deck is generated per run (bundled deck is
  the fallback offered if generation fails).
- **Player imported a deck** (store download or editor import) → their
  deck always wins and is never overwritten by app updates.
- **App update ships a new version of a bundled deck** → it replaces the
  old bundled copy in players' saves, because bundled decks are tagged
  `source: "bundled"` and treated as replaceable defaults.
