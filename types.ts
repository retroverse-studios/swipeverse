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

export type CardData = {
  id: string;
  prompt: string;
  imageUrl?: string; // Optional image for the card
  leftChoice: Choice;
  rightChoice: Choice;
};

export type Deck = {
    name?: string;
    description?: string;
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