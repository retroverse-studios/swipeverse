import { describe, it, expect } from 'vitest';
import { validateAndRepairDeck } from './aiProvider';
import type { Deck } from '../types';

const card = (prompt: string, leftExtra: object = {}) => ({
  prompt,
  leftChoice: { text: 'Left', effects: { Power: 5 }, ...leftExtra },
  rightChoice: { text: 'Right', effects: { Power: -5 } },
});

const deckOf = (cards: unknown[], extra: object = {}): Deck =>
  ({ name: 'Test', description: 'd', cards, ...extra }) as unknown as Deck;

describe('validateAndRepairDeck branch preservation (AUDIT H1)', () => {
  it('keeps well-formed stat branches', () => {
    const deck = validateAndRepairDeck(
      deckOf([
        card('A', { branches: [{ stat: 'Wealth', gte: 60, nextCardIndex: 2 }] }),
        card('B'),
        card('C'),
      ]),
    );
    expect(deck.cards[0].leftChoice.branches).toEqual([
      { stat: 'Wealth', gte: 60, nextCardIndex: 2 },
    ]);
  });

  it('drops malformed branches but keeps the card', () => {
    const deck = validateAndRepairDeck(
      deckOf([
        card('A', {
          branches: [
            { stat: 'Nope', gte: 10, nextCardIndex: 1 },
            { stat: 'Power', nextCardIndex: 1 }, // no bound: never matches
            { stat: 'Power', gte: 10, nextCardIndex: 99 }, // out of range
            { stat: 'People', lte: 250, nextCardIndex: 1 }, // clamped to 100
          ],
        }),
        card('B'),
      ]),
    );
    expect(deck.cards).toHaveLength(2);
    expect(deck.cards[0].leftChoice.branches).toEqual([
      { stat: 'People', lte: 100, nextCardIndex: 1 },
    ]);
  });

  it('strips branch targets when a card is dropped (indices shift)', () => {
    const deck = validateAndRepairDeck(
      deckOf([
        card('A', { branches: [{ stat: 'Power', gte: 10, nextCardIndex: 1 }] }),
        { prompt: '', leftChoice: { text: 'x', effects: {} }, rightChoice: { text: 'y', effects: {} } },
        card('C'),
      ]),
    );
    expect(deck.cards).toHaveLength(2);
    expect(deck.cards[0].leftChoice.branches).toBeUndefined();
    expect(deck.cards[0].leftChoice.nextCardIndex).toBeUndefined();
  });

  it('preserves series/category metadata', () => {
    const deck = validateAndRepairDeck(
      deckOf([card('A')], { series: { name: 'Saga', part: 2 }, category: 'education' }),
    );
    expect(deck.series).toEqual({ name: 'Saga', part: 2 });
    expect(deck.category).toBe('education');
  });

  it('clamps effects to ±50 and rejects empty decks', () => {
    const deck = validateAndRepairDeck(deckOf([card('A', { effects: { Power: 500 } })]));
    expect(deck.cards[0].leftChoice.effects.Power).toBe(50);
    expect(() => validateAndRepairDeck(deckOf([]))).toThrow();
  });
});
