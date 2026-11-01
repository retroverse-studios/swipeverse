/**
 * Boundary validation for data that arrives as untyped JSON: localStorage,
 * editor file imports, the store catalog, and deckUrl fetches. Realities get
 * field-by-field defaults (only id + name are truly required); decks go
 * through the shared deck validator. Invalid entries are dropped, never
 * trusted — a malformed record persisted today would otherwise crash
 * GameScreen renders tomorrow.
 */

import { Reality, LibraryDeck } from '../types';
import { validateAndRepairDeck } from './aiProvider';

const isRecord = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

const str = (x: unknown, fallback = ''): string => (typeof x === 'string' ? x : fallback);

const strRecord = (x: unknown, keys: string[], fallback: Record<string, string>): Record<string, string> => {
  const src = isRecord(x) ? x : {};
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = str(src[k], fallback[k] ?? '');
  return out;
};

const STAT_KEYS = ['Power', 'Wealth', 'People', 'Knowledge'];

export function sanitizeReality(x: unknown): Reality | null {
  if (!isRecord(x)) return null;
  if (typeof x.id !== 'string' || !x.id.trim()) return null;
  if (typeof x.name !== 'string' || !x.name.trim()) return null;

  let deck: Reality['deck'];
  if (isRecord(x.deck) && Array.isArray(x.deck.cards)) {
    try {
      deck = validateAndRepairDeck(x.deck as never);
      // validateAndRepairDeck drops the bundled tag handling to the caller;
      // preserve a stored deck's source marker so merge logic still works
      if ((x.deck as Record<string, unknown>).source === 'bundled') deck.source = 'bundled';
    } catch {
      deck = undefined; // unplayable deck: keep the reality, drop the deck
    }
  }

  return {
    id: x.id,
    name: x.name,
    description: str(x.description),
    font: str(x.font, 'font-exo'),
    systemInstruction: str(x.systemInstruction),
    statNames: strRecord(x.statNames, STAT_KEYS, {
      Power: 'Power',
      Wealth: 'Wealth',
      People: 'People',
      Knowledge: 'Knowledge',
    }) as Reality['statNames'],
    ...(Array.isArray(x.imageSet)
      ? { imageSet: x.imageSet.filter((u): u is string => typeof u === 'string') }
      : {}),
    ...(typeof x.deckUrl === 'string' && x.deckUrl ? { deckUrl: x.deckUrl } : {}),
    ...(deck ? { deck } : {}),
    ...(isRecord(x.soundConfig) ? { soundConfig: x.soundConfig as Reality['soundConfig'] } : {}),
    ...(x.category === 'game' || x.category === 'education' ? { category: x.category } : {}),
    colors: strRecord(x.colors, ['primary', 'secondary', 'background', 'accent'], {
      primary: 'text-tarot-gold-bright',
      secondary: 'text-tarot-gold-bright',
      background: 'bg-velvet',
      accent: 'border-tarot-gold',
    }) as Reality['colors'],
  };
}

export function sanitizeRealities(x: unknown): Reality[] {
  if (!Array.isArray(x)) return [];
  return x.map(sanitizeReality).filter((r): r is Reality => r !== null);
}

export function sanitizeLibrary(x: unknown): LibraryDeck[] {
  if (!Array.isArray(x)) return [];
  const out: LibraryDeck[] = [];
  for (const entry of x) {
    if (!isRecord(entry) || typeof entry.id !== 'string' || !isRecord(entry.deck)) continue;
    try {
      out.push({
        id: entry.id,
        addedAt: str(entry.addedAt, new Date(0).toISOString()),
        deck: validateAndRepairDeck(entry.deck as never),
      });
    } catch {
      // skip unplayable stored deck
    }
  }
  return out;
}
