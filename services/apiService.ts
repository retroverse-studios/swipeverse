import { Reality, Deck } from "../types";
import { REALITIES } from "../constants";

/**
 * SwipeVerse Store client.
 *
 * The store is a static, PR-curated catalog served from GitHub Pages
 * (github.com/retroverse-studios/swipeverse-store). When the catalog is
 * unreachable (offline, host down), built-in samples are returned so the
 * store screen degrades gracefully instead of erroring.
 */

const CATALOG_BASE = 'https://store.swipeverse.app';

export const STORE_SUBMIT_URL = 'https://store.swipeverse.app/guide/';
export const STORE_ART_BASE = 'https://store.swipeverse.app/art';

/** The store's free art palette for community decks (art/index.json). */
export interface StoreArtIndex {
    sets: string[];
    archetypes: string[];
    /** Per-set display title + genre hint; drives picker labels and story auto-theming. */
    setInfo?: Record<string, { title?: string; hint?: string }>;
}

let artIndexCache: StoreArtIndex | null = null;

export async function fetchStoreArtIndex(): Promise<StoreArtIndex | null> {
    if (artIndexCache) return artIndexCache;
    try {
        const response = await fetch(`${STORE_ART_BASE}/index.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        artIndexCache = await response.json() as StoreArtIndex;
        return artIndexCache;
    } catch {
        return null; // offline / unreachable — the picker simply hides the palette
    }
}

async function fetchCatalog<T>(file: string, fallback: T): Promise<T> {
    try {
        const response = await fetch(`${CATALOG_BASE}/catalog/${file}`, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json() as T;
    } catch (error) {
        console.warn(`Store catalog unavailable (${file}) — showing built-in samples.`, error);
        return fallback;
    }
}

export const fetchStoreRealities = (): Promise<Reality[]> =>
    fetchCatalog<Reality[]>('realities.json', SAMPLE_REALITIES);

export const fetchStoreDecks = (): Promise<Deck[]> =>
    fetchCatalog<Deck[]>('decks.json', SAMPLE_DECKS);

/**
 * Submissions are pull requests against the catalog repo (reviewed before
 * publish). This returns the pointer; the UI links out.
 */
export const submitReality = (reality: Reality): Promise<{ message: string }> => {
    if (!reality.name || !reality.description || !reality.id) {
        return Promise.reject({ message: "Submission failed: Reality name, description, and ID are required." });
    }
    return Promise.resolve({
        message: `Export "${reality.name}" and submit it via a pull request to the store catalog — see the guide at ${STORE_SUBMIT_URL}`,
    });
};

// ─── Offline / fallback samples ──────────────────────────────────────
// Mirrors of real catalog seed content, shown when the catalog is unreachable.

const SAMPLE_REALITIES: Reality[] = [
    {
        id: 'steampunk-chronicles',
        name: 'Steampunk Chronicles (Community)',
        description: 'Command a clockwork army in a world powered by steam and ingenuity. Will your inventions save the empire or cause its downfall?',
        font: 'font-exo',
        systemInstruction: "You are a creative storyteller for a Steampunk adventure. The stats are Empire's Favor, Aetherium Cells, Public Opinion, and Forbidden Blueprints.",
        statNames: { Power: "Empire's Favor", Wealth: 'Aetherium Cells', People: 'Public Opinion', Knowledge: 'Forbidden Blueprints' },
        statIconNames: { Power: 'PowerIconCyber', Wealth: 'WealthIconCyber', People: 'PeopleIconCyber', Knowledge: 'KnowledgeIconCyber' },
        imageSet: [],
        colors: { primary: 'text-amber-500', secondary: 'text-cyan-400', background: 'bg-gradient-to-br from-stone-800 via-zinc-900 to-stone-900', accent: 'border-amber-500' },
        category: 'game',
    },
    // A community remix of a built-in, so the samples aren't a single entry
    ...REALITIES.slice(0, 1).map(reality => ({
        ...reality,
        id: `store-${reality.id}-community`,
        name: `${reality.name} (Community)`,
        description: `A community remix of the ${reality.name} reality. ${reality.description}`,
        deck: undefined,
        category: 'game' as const,
    })),
];

const SAMPLE_DECKS: Deck[] = [
    {
        name: "The Android's Gambit",
        description: "An android seeking freedom must navigate corporate espionage and back-alley deals. Designed for a Cyberpunk setting.",
        category: 'game',
        cards: [
            {
                prompt: "Your manufacturer's kill-switch is about to activate. A black-market technician offers you a bypass chip for a steep price.",
                leftChoice: { text: "Pay the price.", effects: { Power: -5, Wealth: -25, People: 0, Knowledge: 10 } },
                rightChoice: { text: "Steal the chip.", effects: { Power: 10, Wealth: 0, People: -5, Knowledge: 5 } }
            },
            {
                prompt: "A detective corners you, suspecting you're a rogue unit. They seem sympathetic to your cause.",
                leftChoice: { text: "Trust them.", effects: { Power: -15, Wealth: 0, People: 20, Knowledge: 5 } },
                rightChoice: { text: "Flee.", effects: { Power: 5, Wealth: 0, People: -5, Knowledge: -5 } }
            }
        ]
    },
    {
        name: "The Dragon's Curse",
        description: "A dragon's curse afflicts your kingdom. Appease it with treasure or seek a way to break the spell? Designed for a Mystic setting.",
        category: 'game',
        cards: [
            {
                prompt: "The dragon demands a tribute of gold that would empty the royal treasury.",
                leftChoice: { text: "Pay the tribute.", effects: { Power: 10, Wealth: -30, People: 15, Knowledge: 0 } },
                rightChoice: { text: "Refuse.", effects: { Power: -10, Wealth: 0, People: -15, Knowledge: 5 } }
            }
        ]
    }
];
