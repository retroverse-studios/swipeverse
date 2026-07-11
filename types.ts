export enum GameState {
  MainMenu,
  Playing,
  GameOver,
  Editor,
  Store,
}

export type StatName = 'Power' | 'Wealth' | 'People' | 'Knowledge';

export type Stats = Record<StatName, number>;

export type SoundConfig = {
    backgroundMusicUrl?: string;
    swipeLeftUrl?: string;
    swipeRightUrl?: string;
    gameStartUrl?: string;
    gameWinUrl?: string;
    gameLoseUrl?: string;
};

export type Choice = {
  text: string;
  effects: Partial<Stats>;
  nextCardIndex?: number; // Optional: index of the next card to jump to
  soundUrl?: string; // Optional: sound effect for this choice
};

/**
 * Card archetypes — the genre's standard dilemma categories. Drives default
 * card art selection and border styling; optional so untagged cards still work.
 */
export const CARD_ARCHETYPES = [
  'petitioner',  // someone asks you for something
  'crisis',      // something bad happens to you
  'opportunity', // a windfall, offer, or lucky find
  'faction',     // a power bloc acts (guild, corp, army, church)
  'advisor',     // information or a warning
  'chain',       // part of a multi-card storyline
  'judgement',   // two parties in dispute; you pick a side
  'gamble',      // uncertain outcome regardless of choice
  'terminal',    // endings: death, collapse, coup
] as const;
export type CardArchetype = typeof CARD_ARCHETYPES[number];

export type CardData = {
  id: string;
  prompt: string;
  archetype?: CardArchetype; // Optional: selects default art and styling
  imageUrl?: string; // Optional image for the card
  leftChoice: Choice;
  rightChoice: Choice;
};

/** Store catalog classification — set on store entries, optional elsewhere. */
export type ContentCategory = 'game' | 'education';

export type Deck = {
    name?: string;
    description?: string;
    category?: ContentCategory;
    /**
     * Multi-arc stories: decks sharing a series name form a saga. Finishing
     * part N offers "Next in the series" (part N+1) at game over, resolved
     * from the player's library first, then the store catalog.
     */
    series?: { name: string; part: number };
    /**
     * 'bundled' marks starter decks shipped with the app (see decks/). They act as
     * defaults: a newer app version may replace them, and AI generation takes over
     * when a provider is configured. Decks imported by the player (store downloads,
     * editor imports) omit this field and are never overwritten.
     */
    source?: 'bundled';
    cards: Omit<CardData, 'id'>[];
}

export type Reality = {
  id:string;
  name: string;
  description: string;
  font: string;
  systemInstruction: string;
  statNames: Record<StatName, string>;
  statIconNames: Record<StatName, string>; // Serializable icon names
  imageSet?: string[]; // Optional set of image URLs for cards
  deckUrl?: string; // Optional URL to a pre-defined deck of cards
  deck?: Deck; // Optional user-imported deck data for persistence
  soundConfig?: SoundConfig; // Optional sound configuration for the reality
  category?: ContentCategory; // Store catalog classification
  colors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  }
};

export type LibraryDeck = {
  id: string;      // stable id for list operations
  addedAt: string; // ISO timestamp
  deck: Deck;
};

export type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'error';
};