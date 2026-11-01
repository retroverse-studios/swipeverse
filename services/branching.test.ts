import { describe, it, expect } from 'vitest';
import { resolveNextIndex } from './branching';
import { applyDifficultyModifier } from './gameHistory';
import { analyzeDeck } from './deckSolver';
import { buildLinkedReality } from './playLink';
import type { Choice, Deck, Stats } from '../types';

const stats: Stats = { Power: 50, Wealth: 70, People: 50, Knowledge: 50 };

describe('resolveNextIndex', () => {
  it('prefers the first matching stat branch', () => {
    const choice: Choice = {
      text: 'x',
      effects: {},
      nextCardIndex: 5,
      branches: [
        { stat: 'Wealth', gte: 80, nextCardIndex: 9 },
        { stat: 'Wealth', gte: 60, nextCardIndex: 7 },
      ],
    };
    expect(resolveNextIndex(choice, stats, 0)).toBe(7);
  });

  it('falls back to nextCardIndex, then sequential', () => {
    expect(resolveNextIndex({ text: 'x', effects: {}, nextCardIndex: 4 }, stats, 1)).toBe(4);
    expect(resolveNextIndex({ text: 'x', effects: {} }, stats, 1)).toBe(2);
  });

  it('a branch with no bounds never matches', () => {
    const choice: Choice = {
      text: 'x',
      effects: {},
      branches: [{ stat: 'Power', nextCardIndex: 9 }],
    };
    expect(resolveNextIndex(choice, stats, 2)).toBe(3);
  });
});

describe('applyDifficultyModifier', () => {
  it('scales symmetrically per difficulty', () => {
    expect(applyDifficultyModifier(10, 'easy')).toBe(7);
    expect(applyDifficultyModifier(-10, 'hard')).toBe(-13);
    expect(applyDifficultyModifier(10, 'standard')).toBe(10);
  });
});

describe('analyzeDeck', () => {
  const gentle: Deck = {
    name: 'Gentle',
    cards: [
      {
        prompt: 'A',
        leftChoice: { text: 'l', effects: { Power: 5 } },
        rightChoice: { text: 'r', effects: { Power: -5 } },
      },
      {
        prompt: 'B',
        leftChoice: { text: 'l', effects: {} },
        rightChoice: { text: 'r', effects: {} },
      },
    ],
  };

  it('finds a trivially winnable deck winnable', () => {
    const analysis = analyzeDeck(gentle);
    expect(analysis.perDifficulty.every((d) => d.winnable === 'yes')).toBe(true);
  });

  it('flags a deck that can never lose', () => {
    const analysis = analyzeDeck(gentle);
    expect(analysis.suggestions.some((s) => s.includes('Impossible to lose'))).toBe(true);
  });
});

describe('buildLinkedReality', () => {
  it('builds a playable reality from a bare deck and keeps its branches', () => {
    const reality = buildLinkedReality({
      name: 'Linked',
      cards: [
        {
          prompt: 'A',
          leftChoice: {
            text: 'l',
            effects: {},
            branches: [{ stat: 'Power', gte: 40, nextCardIndex: 1 }],
          },
          rightChoice: { text: 'r', effects: {} },
        },
        {
          prompt: 'B',
          leftChoice: { text: 'l', effects: {} },
          rightChoice: { text: 'r', effects: {} },
        },
      ],
    });
    expect(reality.deck?.cards).toHaveLength(2);
    expect(reality.deck?.cards[0].leftChoice.branches).toHaveLength(1);
  });

  it('throws when the payload has no playable deck', () => {
    expect(() => buildLinkedReality({ hello: 'world' })).toThrow();
  });
});
