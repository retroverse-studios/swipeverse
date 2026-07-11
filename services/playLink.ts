/**
 * Direct play links: swipeverse.app/app/?play=<url>[&difficulty=...][&shell=...]
 *
 * The URL must return JSON that is a Reality (with an embedded deck), an
 * editor export (Reality[]), or a bare Deck. The scenario is played
 * ephemerally — never added to the player's collection — which is the point
 * for classroom links: click → play, nothing installed.
 */

import { Reality, Deck } from '../types';
import { validateAndRepairDeck } from './aiProvider';

export function buildLinkedReality(data: unknown): Reality {
  let realityLike: Partial<Reality> | undefined;
  let deck: Deck | undefined;

  if (Array.isArray(data)) {
    // Editor export: prefer the first reality that carries a deck
    const realities = data as Partial<Reality>[];
    realityLike = realities.find(r => r?.deck?.cards && r.deck.cards.length > 0) ?? realities[0];
  } else if (data && typeof data === 'object') {
    if ('cards' in data) deck = data as Deck;
    else realityLike = data as Partial<Reality>;
  }

  if (!deck && realityLike?.deck) deck = realityLike.deck;
  if (!deck || !Array.isArray(deck.cards) || deck.cards.length === 0) {
    throw new Error('the linked file contains no playable deck');
  }
  deck = validateAndRepairDeck(deck);

  return {
    id: realityLike?.id || 'linked-scenario',
    name: realityLike?.name || deck.name || 'Linked Scenario',
    description: realityLike?.description || deck.description || '',
    font: realityLike?.font || 'font-exo',
    systemInstruction: realityLike?.systemInstruction || 'You are the storyteller for a linked SwipeVerse scenario.',
    statNames: realityLike?.statNames || { Power: 'Power', Wealth: 'Wealth', People: 'People', Knowledge: 'Knowledge' },
    statIconNames: realityLike?.statIconNames || { Power: 'PowerIconCyber', Wealth: 'WealthIconCyber', People: 'PeopleIconCyber', Knowledge: 'KnowledgeIconCyber' },
    imageSet: realityLike?.imageSet,
    soundConfig: realityLike?.soundConfig,
    colors: realityLike?.colors || {
      primary: 'text-tarot-gold-bright',
      secondary: 'text-tarot-gold-bright',
      background: 'bg-velvet',
      accent: 'border-tarot-gold',
    },
    deck,
  };
}
