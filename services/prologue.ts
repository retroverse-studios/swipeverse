/**
 * Prologue (deck intro card) preferences.
 *
 * The prologue always shows the first time a deck is played. Whether it
 * shows again on replays is a player setting; which decks have been seen
 * is remembered per deck so a new story always gets its introduction.
 */

const SETTING_KEY = 'swipeverse-skip-prologue-on-replay';
const SEEN_KEY = 'swipeverse-prologue-seen';
const MAX_SEEN_ENTRIES = 200;

/** Skip the prologue on replays (default: on — replays go straight to card 0). */
export function loadSkipPrologueOnReplay(): boolean {
    try {
        return window.localStorage.getItem(SETTING_KEY) !== 'false';
    } catch {
        return true;
    }
}

export function saveSkipPrologueOnReplay(skip: boolean): void {
    try {
        window.localStorage.setItem(SETTING_KEY, String(skip));
    } catch (error) {
        console.error('Failed to save prologue setting:', error);
    }
}

/**
 * A deck is identified by reality + deck name, so an updated bundled deck or
 * a freshly AI-generated story with a new name gets its prologue again.
 */
export function prologueKeyFor(realityId: string, deckName?: string): string {
    return `${realityId}::${deckName ?? ''}`;
}

function loadSeen(): string[] {
    try {
        const stored = window.localStorage.getItem(SEEN_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
    } catch {
        return [];
    }
}

export function hasSeenPrologue(key: string): boolean {
    return loadSeen().includes(key);
}

export function markPrologueSeen(key: string): void {
    try {
        const seen = loadSeen().filter(k => k !== key);
        seen.push(key);
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-MAX_SEEN_ENTRIES)));
    } catch (error) {
        console.error('Failed to record prologue as seen:', error);
    }
}
