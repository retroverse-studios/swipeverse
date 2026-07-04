# SwipeVerse

<!-- BADGES:START -->
[![ai](https://img.shields.io/badge/-ai-ff6f00?style=flat-square)](https://github.com/topics/ai) [![card-game](https://img.shields.io/badge/-card--game-blue?style=flat-square)](https://github.com/topics/card-game) [![game](https://img.shields.io/badge/-game-blue?style=flat-square)](https://github.com/topics/game) [![pwa](https://img.shields.io/badge/-pwa-blue?style=flat-square)](https://github.com/topics/pwa) [![strategy-game](https://img.shields.io/badge/-strategy--game-blue?style=flat-square)](https://github.com/topics/strategy-game) [![typescript](https://img.shields.io/badge/-typescript-3178c6?style=flat-square)](https://github.com/topics/typescript) [![web-app](https://img.shields.io/badge/-web--app-blue?style=flat-square)](https://github.com/topics/web-app) [![swipe-mechanics](https://img.shields.io/badge/-swipe--mechanics-blue?style=flat-square)](https://github.com/topics/swipe-mechanics)
<!-- BADGES:END -->

A card-based survival strategy game where you swipe to shape the fate of entire realities. Powered by AI-generated narratives — navigate cyberpunk dystopias, mystical kingdoms, and galactic empires, or create your own.

**A RetroVerse Studios game.**

## Features

- **Swipe-Based Gameplay**: Swipe left or right to make choices that affect your reality's stats
- **Four Core Stats**: Manage Power, Wealth, People, and Knowledge — don't let any reach 0 or 100!
- **Multiple Realities**: Play through different themed scenarios, each with unique narratives
- **Multi-Provider AI**: Generate decks with Google Gemini, OpenAI, Anthropic Claude, or Ollama (local)
- **Reality Editor**: Create and customize your own realities with a visual graph editor
- **Store System**: Browse and play community-created realities *(currently a demo with built-in sample content — see Roadmap)*
- **Progressive Web App**: Install and play offline
- **Sound Effects**: Immersive audio feedback for game actions

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- An API key from at least one AI provider (or Ollama running locally)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd swipeverse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env.local` file with your API keys:
   ```
   GEMINI_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   ```

   You can also configure API keys in-app via **AI Settings** on the main menu.

4. Start the development server:
   ```bash
   npm run dev
   ```

## How to Play

1. **Choose a Reality**: Select from pre-made realities or create your own
2. **Configure AI** (first time): Click "AI Settings" to choose your AI provider
3. **Make Decisions**: Swipe cards left or right to make choices
4. **Manage Stats**: Keep all four stats balanced — if any reach 0 or 100, you lose!
5. **Survive**: Navigate through 20 AI-generated scenarios to reach the end

## AI Providers

| Provider | Key Required | Structured Output | Cost |
|----------|-------------|-------------------|------|
| **Google Gemini** (default) | Yes | Native JSON schema | Free tier available |
| **OpenAI** | Yes | JSON mode | Paid |
| **Anthropic Claude** | Yes | Text → JSON parse | Paid |
| **Ollama** | No (local) | JSON mode | Free |

The OpenAI provider supports any OpenAI-compatible API (Azure, Groq, Together, etc.) via the Base URL setting.

## Creating Custom Realities

Use the built-in Reality Editor to:
- Define your reality's theme and setting
- Create custom AI instructions for card generation
- Design the visual style (fonts, colors, images)
- Add sound effects and background music
- Generate story decks with the AI Story Director
- Build branching narratives with the visual graph editor

## Building for Production

```bash
npm run build
```

## Roadmap

### TODO: Generate and bundle starter decks

The plumbing is in place (`decks/` folder — see `decks/README.md` for the
workflow), but no starter decks have been generated yet. Use the editor's AI
Story Director to create one deck per built-in reality (`cyberpunk`,
`mystical`, `space`), playtest them, and save the exports as
`decks/<realityId>.json`. Until then, new players still need an AI provider
to play.

### TODO: Open the Community Store for real

The store UI is finished but runs against mock data (`services/apiService.ts` fabricates
entries with fake network delays). To make it live:

1. **Host a catalog** — the cheapest path is a public GitHub repo containing a
   `realities.json` / `decks.json` that `fetchStoreRealities` / `fetchStoreDecks` fetch
   via raw.githubusercontent.com. No backend needed.
2. **Accept submissions** — start with GitHub PRs/issues against that catalog repo
   (replace `submitReality`'s mock with a link or a `gh`-backed flow); graduate to a
   small API (e.g. Cloudflare Workers + KV) if volume justifies it.
3. **Remove the demo label** — delete the Demo badge and notice in
   `components/StoreScreen.tsx` once real data is wired up.

### Store & content architecture (decided)

Decisions made while designing the store — recorded so future work doesn't relitigate them:

- **Local collection is the source of truth; the store is discovery.** "Add" copies
  content into the player's browser (realities list / deck library), and everything
  plays from local storage afterwards — instant and offline. Players never load
  content live from the store to play it.
- **Bundled starter decks stay.** They are the offline/zero-setup floor (the PWA's
  "install and play offline" promise) and cost ~50 KB. Deck size makes browser
  memory a non-issue (~15 KB per deck, localStorage holds ~5 MB).
- **Deck precedence:** player-imported deck → AI generation (if a provider is
  configured) → bundled deck. Bundled decks are tagged `source: "bundled"` and are
  replaceable defaults; anything the player imported is never overwritten by updates.
- **Deck library (shipped).** "My Library" tab in the store: store adds accumulate
  there and never overwrite; "Load into Reality" fills a reality's single active
  deck slot while the library keeps the copy. Export/import to disk is the backup
  story — localStorage dies to "Clear site data". `navigator.storage.persist()` is
  requested at startup to prevent automatic eviction, but only a disk export
  survives a manual clear.
- **No accounts for now.** Accounts/portfolios/private uploads/cloud-synced
  libraries all require a real backend (auth, per-user storage, moderation at
  scale). The PR-curated catalog gives publishing without any of that. Revisit only
  if a creator community materializes; the catalog format migrates cleanly.

### Store content policy (for when submissions open)

- **Threat model:** decks are inert JSON — no code execution path, and React
  escapes rendered text, so there is no "jailbreak from a deck". The real vectors:
  1. **External URLs** (`imageUrl`, `soundUrl`, `imageSet`, `deckUrl`) — arbitrary
     hosts mean tracking/IP leaks and unmoderatable imagery. Policy: reject or
     strip external URLs on submission unless from an allowlisted host; prefer
     text-only store decks.
  2. **`systemInstruction` on realities** is prompt injection by design — it runs
     against the *player's* AI key. It can't steal the key, but it can steer
     generation somewhere nasty. Moderate this field like any other text; review
     realities more strictly than decks.
  3. **Skewed mechanics** (e.g. ±50 effects everywhere) are a griefing vector —
     already bounded by `validateAndRepairDeck`'s clamping.
- **Moderation flow:** deck content is small, pure text — cheap to screen. On
  submission, run all text (cards, name, description, `systemInstruction`) through
  an automated moderation pass (moderation API or a cheap LLM classification);
  auto-approve high-confidence-clean, queue the rest for manual review. At early
  volumes, reviewing everything by hand is fine — the PR-based catalog makes every
  submission a human-approved diff anyway ("if I'm not comfortable, it doesn't go in").

## Technologies

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Google Gemini / OpenAI / Claude / Ollama** — AI content generation
- **React Flow** — Visual editor
- **PWA** — Offline support

## License

MIT — RetroVerse Studios
