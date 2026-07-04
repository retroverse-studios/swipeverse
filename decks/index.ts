import { Deck, Reality } from '../types';
import { validateAndRepairDeck } from '../services/aiProvider';

/**
 * Bundled starter decks, keyed by reality id.
 *
 * Drop a JSON file in this folder named after the reality it belongs to
 * (e.g. `cyberpunk.json`) and it ships with the app — see decks/README.md
 * for the full workflow. Accepted file shapes:
 *   - a bare deck:            { "name": ..., "cards": [...] }
 *   - a single reality:       { "id": ..., "deck": {...}, ... }
 *   - an editor export array: [ { "id": ..., "deck": {...} }, ... ]
 * For the reality shapes, the deck for the reality matching the filename
 * (or the first reality carrying a deck) is used.
 */
export const BUNDLED_DECKS: Record<string, Deck> = {};

function extractDeck(data: unknown, realityId: string): Deck | null {
    if (!data || typeof data !== 'object') return null;
    if (Array.isArray(data)) {
        const realities = data as Reality[];
        const match = realities.find(r => r.id === realityId) ?? realities.find(r => r.deck);
        return match?.deck ?? null;
    }
    if ('cards' in data) return data as Deck;
    if ('deck' in data) return (data as Reality).deck ?? null;
    return null;
}

const deckModules = import.meta.glob('./*.json', { eager: true }) as Record<string, { default: unknown }>;

for (const [path, module] of Object.entries(deckModules)) {
    // Accept both `<realityId>.json` and the editor's export name `deck-<realityId>.json`
    const realityId = path.replace('./', '').replace(/^deck-/, '').replace(/\.json$/, '');
    const rawDeck = extractDeck(module.default, realityId);
    if (!rawDeck) {
        console.error(`Bundled deck ${path} contains no deck data — skipping.`);
        continue;
    }
    try {
        BUNDLED_DECKS[realityId] = { ...validateAndRepairDeck(rawDeck), source: 'bundled' };
    } catch (error) {
        console.error(`Bundled deck ${path} is invalid — skipping.`, error);
    }
}
