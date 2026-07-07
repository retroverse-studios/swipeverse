# Design Refresh Plan — "Make it feel like a game"

_Drafted 2026-07-07, while themed art is being generated (docs/art-prompts.md)._

## Goal

The game plays well but presents like a web app: generic dark-slate Tailwind
shell, no ceremony, cards that appear rather than arrive. The refresh gives
SwipeVerse one distinctive retro identity (it's a RetroVerse Studios game —
lean into it), makes every interaction feel physical, and produces the visual
assets needed for the itch.io launch page.

**Not in scope:** gameplay rules, deck/stat mechanics, editor workflow
(consistency pass only), store backend.

## Process

1. **Direction mockups** — build 3–4 radically different visual directions of
   the two key screens (main menu + game screen), toggleable in the browser.
   Michael picks one (or a hybrid).
2. **Implement the shell** — menu, modals, buttons, toasts, store/library,
   game-over, About panel (the landing-page content, inside the game).
3. **Card chrome + juice** — the checklist below, designed as one system.
4. **Export itch.io assets** — cover (630×500), 3–5 screenshots, one gif.

## Candidate directions (pre-agreed briefs for the mockup session)

- **A. CRT Arcade** — scanline overlay, phosphor glow, chunky pixel display
  font, bezel-framed screens, boot-up flicker on load. Maximum RetroVerse.
  Risk: kitsch if overdone; needs restraint.
- **B. Neon Tarot** — cards as occult artifacts: ornate pixel frames, dark
  velvet background, foil-gold accents, deliberate deal ceremony. Gravitas;
  fits the "fate of realities" fiction.
- **C. Handheld Console** — Game-Boy-era chrome: palette-limited UI, chunky
  HUD, realities presented as cartridges you "insert". Playful, charming,
  very shareable screenshots.
- **D. Disciplined Glass** — keep the current dark-glass direction but tuned:
  pixel art carries the identity, UI recedes. Safest, least distinctive.

Each mockup uses real card art (whatever sets exist by then) so the pick is
made against reality, not lorem-ipsum vibes.

## Card anatomy (the chrome system)

One card = frame + art window + prompt plate + hint row. Specified so every
piece has a data source that already exists:

| Element | Driven by |
|---|---|
| Frame/border color | `archetype` (requests neutral, crisis red, opportunity gold, faction purple…) |
| Art window | archetype scene art (per-reality set, base fallback) |
| Stat badge (small icon on art) | computed: stat with largest absolute effect — no authoring |
| Card back | per-reality back (art-drops/backs) |
| Chain marker | `archetype === 'chain'` corner token |
| Node counter | exists (`Node 3 / 20`) — restyle |

## Game-feel checklist (the "juice")

Ordered roughly by impact per effort. All CSS transform/opacity, no new
dependencies expected; everything respects `prefers-reduced-motion`.

1. **Drag stat-preview** — while dragging, the stat meters that this choice
   will touch light up (magnitude hinted by intensity, direction hidden).
   This is the genre's signature interaction and the single biggest
   game-feel win. Data already on the card.
2. **Deal-in on deck load** — cards fly in as backs, top card flips face-up.
   Replaces spinner-then-pop. Gives the card backs their job.
3. **Advance transition** — next card flips or slides up from the stack
   (behind-stack shows backs, fixing the face-up-future-cards oddity).
4. **Stat meter feedback** — pulse on change; persistent warning state when
   any stat is ≤15 or ≥85 (glow/shake). Turns the loss condition into felt
   tension instead of a surprise.
5. **Game-over ceremony** — short per-outcome sequence (card burn/glitch,
   stat meter shattering) before the summary screen.
6. **Micro-feedback** — swipe commit haptic (`navigator.vibrate`, mobile),
   button hover/press states, screen-to-screen transitions, toast restyle.
7. **Ambient motion** — subtle per-reality background drift/parallax. Last;
   only if the chosen direction wants it.

## Shell screens to restyle

Main menu (reality select is the hero moment — direction C makes it literal
cartridges), AI settings modal, store + library, editor (consistency pass
only), game over, confirmation modals, toasts, About panel (new: the landing
content — what/why/links — reachable from the menu).

## Technical notes

- Tailwind is loaded from the CDN at runtime (`index.html`). Fine for now;
  if the refresh wants custom design tokens (fonts, colors, animations
  beyond arbitrary classes), migrate to the Tailwind Vite build in step 2.
  Decide then, not before.
- Fonts: current Orbitron/MedievalSharp/Exo 2 stay available per reality;
  the *shell* font is a direction decision (A/C likely add a pixel display
  face for headings only — body text stays readable).
- Animation state lives in `CardStack` (deal/flip/advance) and `StatBar`
  (preview/pulse) — both are already isolated components.
- Landing page (`landing/`) gets reskinned to match the picked direction in
  the same pass; icons (`public/icons/`) get real artwork.

## Definition of done

- One direction picked and applied across game + landing.
- Checklist items 1–5 implemented (6–7 stretch).
- Card chrome driven by archetype/back/badge art.
- itch.io asset pack exported.
