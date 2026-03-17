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
- **Store System**: Browse and play community-created realities
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

## Technologies

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Google Gemini / OpenAI / Claude / Ollama** — AI content generation
- **React Flow** — Visual editor
- **PWA** — Offline support

## License

MIT — RetroVerse Studios
