import { Reality, Stats, CardArchetype } from './types';
import { BUNDLED_DECKS } from './decks';

/**
 * Bundled pixel-art card scenes (public/cards/), keyed by archetype.
 * Archetypes without dedicated art yet borrow the closest scene — replace
 * as the art set grows.
 */
export const CARD_ART: Record<CardArchetype, string[]> = {
  petitioner: ['/cards/petitioner_1.webp', '/cards/petitioner_2.webp', '/cards/petitioner_3.webp'],
  crisis: ['/cards/crisis.webp'],
  opportunity: ['/cards/opportunity.webp'],
  faction: ['/cards/judgement.webp'],      // placeholder until faction art exists
  advisor: ['/cards/petitioner_2.webp'],   // placeholder until advisor art exists
  chain: ['/cards/chain.webp'],
  judgement: ['/cards/judgement.webp'],
  gamble: ['/cards/opportunity.webp'],     // placeholder until gamble art exists
  terminal: ['/cards/crisis.webp'],        // placeholder until terminal art exists
};

export function pickCardArt(archetype: CardArchetype): string {
  const options = CARD_ART[archetype];
  return options[Math.floor(Math.random() * options.length)];
}

// All bundled card scenes — the editor's art picker offers these, and they
// double as the default per-reality image pool for cards with neither their
// own imageUrl nor an archetype. Local files — works offline.
export const BUNDLED_CARD_SCENES = [
  '/cards/petitioner_1.webp',
  '/cards/petitioner_2.webp',
  '/cards/petitioner_3.webp',
  '/cards/crisis.webp',
  '/cards/opportunity.webp',
  '/cards/judgement.webp',
  '/cards/chain.webp',
];
const DEFAULT_IMAGE_SET = BUNDLED_CARD_SCENES;

export const INITIAL_STATS: Stats = {
  Power: 50,
  Wealth: 50,
  People: 50,
  Knowledge: 50,
};

export const MIN_STAT_VALUE = 0;
export const MAX_STAT_VALUE = 100;
export const DECK_SIZE = 20;

// Base64 encoded SVG for a generic fallback image.
// SVG content: <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(255,255,255,0.3)"><rect width="100" height="100" fill="#1f2937" /><path d="M50 10 L10 50 L50 90 L90 50 Z" stroke-width="2"/><line x1="0" y1="30" x2="100" y2="35" stroke-width="1" /><line x1="0" y1="65" x2="100" y2="60" stroke-width="1" /><text x="50" y="55" font-family="monospace" font-size="8" fill="rgba(255,255,255,0.4)" text-anchor="middle">NO SIGNAL</text></svg>
export const FALLBACK_IMAGE_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMWYyOTM3IiAvPjxwYXRoIGQ9Ik01MCAxMCBMMTAgNTAgTDUwIDkwIEw5MCA1MCBaIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMCIgeTE9IjMwIiB4Mj0iMTAwIiB5Mj0iMzUiIHN0cm9rZS13aWR0aD0iMSIgLz48bGluZSB4MT0iMCIgeTE9IjY1IiB4Mj0iMTAwIiB5Mj0iNjAiIHN0cm9rZS13aWR0aD0iMSIgLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iOCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjQpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5OTyBTSUdOQUw8L3RleHQ+PC9zdmc+";

export const DEFAULT_SOUNDS = {
  swipe: "data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUwAAAAg+iD6EPYO3g7WDacNsw2lDacNpQ2lDbANrw2xDbINrA2mDaINfw1yDWkMogylDKAMfwx+DH4Mfgx+DH4Mfgx9DH4Mewx7DHsNewx7DHsNewx7D",
  start: "data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUwAAAD8/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vz+/P78/vwe/P79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/f79/v3+/fw",
  win: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA/gD+AP4A/gD+APwA/AD8APwA/AD8APwAAgD8AP4A/gD+AP4A/gD+AP4A/gD8APwA/AD8APwA/AAAAAAAAAAAAAAAAP4A/gD+AP4A/gD8APwA/AD8APwA/AD8APwA/gD+AP4A/gD+APwA/AD8APwA/AD8APwAAAAAAAAA",
  lose: "data:audio/wav;base64,UklGRmIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWQ8AAAAAAAA/v78/f79/P38/f39/f78/v3+/fz8/v78/vz+/v79/v78/v7+/v78/v3+/P78/v3+/AD+/gD9/AD9/AD+AP4A/AD8AP4A/AD8APwA/AD8APwA/AD8APwA/AD8APwA+AD4APgA+AD4APgA9AD0APQA9AD0APQA9ADz/fT89Pz0/PT89Pz0/PT89Pz0/PT89Pz0/PT89Pz0/PQ==",
};

const BASE_REALITIES: Reality[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Dystopia',
    description: 'Navigate the neon-drenched streets of a corporate-controlled future. Balance chrome and consciousness to survive.',
    font: 'font-orbitron',
    systemInstruction: `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios for a player in a Cyberpunk Dystopia. The player's goal is to balance four stats: Corporate Power, Street Cred, Citizen Trust, and Banned Tech. If any stat reaches 0 or 100, the player loses.`,
    statNames: {
      Power: 'Corp. Power',
      Wealth: 'Street Cred',
      People: 'Citizen Trust',
      Knowledge: 'Banned Tech',
    },
    statIconNames: {
      Power: 'PowerIconCyber',
      Wealth: 'WealthIconCyber',
      People: 'PeopleIconCyber',
      Knowledge: 'KnowledgeIconCyber',
    },
    imageSet: DEFAULT_IMAGE_SET,
    colors: {
      primary: 'text-cyber-pink',
      secondary: 'text-cyber-cyan',
      background: 'bg-gradient-to-br from-gray-900 via-indigo-900 to-black',
      accent: 'border-cyber-pink'
    },
    soundConfig: {
        gameStartUrl: DEFAULT_SOUNDS.start,
        gameWinUrl: DEFAULT_SOUNDS.win,
        gameLoseUrl: DEFAULT_SOUNDS.lose,
        swipeLeftUrl: DEFAULT_SOUNDS.swipe,
        swipeRightUrl: DEFAULT_SOUNDS.swipe,
    },
  },
  {
    id: 'mystical',
    name: 'Mystical Kingdom',
    description: 'Rule a land of magic and myth. Your decisions will shape the fate of your kingdom and the balance of ancient forces.',
    font: 'font-medieval',
    systemInstruction: `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios for a player ruling a Mystical Kingdom. The player's goal is to balance four stats: Royal Authority, Kingdom's Treasury, People's Favor, and Arcane Lore. If any stat reaches 0 or 100, the player loses.`,
    statNames: {
      Power: 'Authority',
      Wealth: 'Treasury',
      People: 'Favor',
      Knowledge: 'Arcane Lore',
    },
    statIconNames: {
      Power: 'PowerIconMystic',
      Wealth: 'WealthIconMystic',
      People: 'PeopleIconMystic',
      Knowledge: 'KnowledgeIconMystic',
    },
    imageSet: DEFAULT_IMAGE_SET,
    colors: {
      primary: 'text-mystic-purple',
      secondary: 'text-mystic-gold',
      background: 'bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900',
      accent: 'border-mystic-gold'
    },
    soundConfig: {
        gameStartUrl: DEFAULT_SOUNDS.start,
        gameWinUrl: DEFAULT_SOUNDS.win,
        gameLoseUrl: DEFAULT_SOUNDS.lose,
        swipeLeftUrl: DEFAULT_SOUNDS.swipe,
        swipeRightUrl: DEFAULT_SOUNDS.swipe,
    },
  },
  {
    id: 'space',
    name: 'Galactic Imperium',
    description: 'Command a star-spanning empire at the edge of the known universe. Forge alliances, explore anomalies, and quell rebellions.',
    font: 'font-exo',
    systemInstruction: `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios for a player leading a Galactic Imperium. The player's goal is to balance four stats: Fleet Strength, Galactic Credits, Alien Relations, and Precursor Data. If any stat reaches 0 or 100, the player loses.`,
    statNames: {
      Power: 'Fleet',
      Wealth: 'Credits',
      People: 'Relations',
      Knowledge: 'Precursor Data',
    },
    statIconNames: {
        Power: 'PowerIconSpace',
        Wealth: 'WealthIconSpace',
        People: 'PeopleIconSpace',
        Knowledge: 'KnowledgeIconSpace',
    },
    imageSet: DEFAULT_IMAGE_SET,
    colors: {
        primary: 'text-space-blue',
        secondary: 'text-space-silver',
        background: 'bg-gradient-to-br from-blue-900 via-gray-900 to-black',
        accent: 'border-space-silver'
    },
    soundConfig: {
        gameStartUrl: DEFAULT_SOUNDS.start,
        gameWinUrl: DEFAULT_SOUNDS.win,
        gameLoseUrl: DEFAULT_SOUNDS.lose,
        swipeLeftUrl: DEFAULT_SOUNDS.swipe,
        swipeRightUrl: DEFAULT_SOUNDS.swipe,
    },
  },
];

// Attach bundled starter decks (decks/<realityId>.json) so built-in realities
// are playable without an AI provider. See decks/README.md.
export const REALITIES: Reality[] = BASE_REALITIES.map(reality =>
    BUNDLED_DECKS[reality.id] ? { ...reality, deck: BUNDLED_DECKS[reality.id] } : reality
);

/**
 * Reconciles realities loaded from localStorage with the current app bundle.
 * Bundled decks are replaceable defaults: a stored reality with no deck, or one
 * still carrying a bundled deck from an earlier version, receives the current
 * bundled deck. Decks the player imported themselves (store downloads, editor
 * imports) are untagged and left untouched.
 */
export function mergeStoredRealities(stored: Reality[]): Reality[] {
    return stored.map(reality => {
        const bundledDeck = BUNDLED_DECKS[reality.id];
        if (bundledDeck && (!reality.deck || reality.deck.source === 'bundled')) {
            return { ...reality, deck: bundledDeck };
        }
        return reality;
    });
}