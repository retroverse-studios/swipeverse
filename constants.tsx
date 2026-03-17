import { Reality, Stats } from './types';

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

export const REALITIES: Reality[] = [
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
    imageSet: [
        'https://images.unsplash.com/photo-1526723864239-3a58e063f256?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1617812581989-341433946050?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1555431182-398d5c4e474c?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1633567531464-90a4240590a5?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1603123853880-7b55f6453d10?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ],
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
    imageSet: [
      'https://images.unsplash.com/photo-1607903803273-96a9fea94558?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1542037104-58f4a39524a2?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1615205510700-41712a8e8013?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1596723795138-12151672ac49?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1519901768427-c1a74a1a3c5a?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ],
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
    imageSet: [
        'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1543722530-53b934711645?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1610296669228-602fa82798f9?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1506443432602-ac2dcd7e20b3?q=80&amp;w=600&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ],
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