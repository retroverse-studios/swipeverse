# Card Art

The card-art pipeline lives in its own repo:
**[retroverse-studios/swipeverse-art](https://github.com/retroverse-studios/swipeverse-art)**
(local: `../art`) — generation tooling (`art.py`), picking UI
(`contact_sheet.py`, `gallery.py`), optimization (`process.py`,
`process_badges.py`), the prompt sheet, the chosen full-res originals
(`drops/`), and the optimized webp masters for all 24 themed sets
(`processed/`).

## What this repo bundles

`public/cards/` contains four complete sets — `base` (fallback for custom
realities) plus the three built-in realities (`cyberpunk`, `mystical`,
`space`). Each set: 9 archetype scenes (768w webp), a portrait card back,
and 4 transparent stat badges named by universal slot
(`power/wealth/people/knowledge` — display names live in game data).

Lookup helpers are in `constants.tsx`: `pickCardArt`, `cardScenesFor`,
`cardBackFor`, `statBadgeFor` — all fall back to `base` for unknown reality
ids.

## The other 20 themed sets

Destined for the **store's shared art palette** (served from the store site,
surfaced in the deck builder's art picker, allowlisted by the store
validator) so community creators can build realities/decks with them.
Tracked in `HANDOVER.md`.

## Updating bundled art

Re-export from the art repo's `processed/` tree and re-run the resize into
`public/cards/` (scenes 768w q82, backs 512w, badges 128px — see the
"Wire the delivered themed art sets" commit for the exact commands).
