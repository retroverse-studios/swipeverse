/**
 * In-app deck solver — powers the editor's Analyze button and the menu's
 * difficulty hints. Mirrors scripts/deck-solver.mjs but reuses the game's own
 * applyDifficultyModifier so the math can never drift from gameplay.
 */

import { Deck, Stats, StatName } from '../types';
import { Difficulty, applyDifficultyModifier } from './gameHistory';
import { INITIAL_STATS, MIN_STAT_VALUE, MAX_STAT_VALUE } from '../constants';

const STAT_KEYS = Object.keys(INITIAL_STATS) as StatName[];
const DIFFICULTIES: Difficulty[] = ['easy', 'standard', 'hard'];
const STATE_CAP = 300_000; // browser safety valve for loop-heavy decks

type Side = 'leftChoice' | 'rightChoice';

interface StepResult {
  outcome: 'win' | 'lose' | 'continue';
  stats: Stats;
  nextIndex: number;
}

function step(deck: Deck, cardIndex: number, stats: Stats, side: Side, difficulty: Difficulty): StepResult {
  const choice = deck.cards[cardIndex][side];
  const next = { ...stats };
  let dead = false;
  for (const stat of STAT_KEYS) {
    const raw = choice.effects[stat] || 0;
    const value = Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, next[stat] + applyDifficultyModifier(raw, difficulty)));
    next[stat] = value;
    if (value <= MIN_STAT_VALUE || value >= MAX_STAT_VALUE) dead = true;
  }
  if (dead) return { outcome: 'lose', stats: next, nextIndex: -1 };
  const nextIndex = typeof choice.nextCardIndex === 'number' ? choice.nextCardIndex : cardIndex + 1;
  if (nextIndex >= deck.cards.length) return { outcome: 'win', stats: next, nextIndex };
  if (nextIndex < 0) return { outcome: 'lose', stats: next, nextIndex };
  return { outcome: 'continue', stats: next, nextIndex };
}

const startStats = (): Stats => ({ ...INITIAL_STATS });
const stateKey = (index: number, stats: Stats) =>
  `${index}:${stats.Power},${stats.Wealth},${stats.People},${stats.Knowledge}`;

/**
 * Exhaustive BFS: can any choice sequence reach `target`? When the target is
 * 'win', also returns one example winning line as ⇦/⇨ moves.
 */
function reachable(deck: Deck, difficulty: Difficulty, target: 'win' | 'lose'):
  { result: 'yes' | 'no' | 'unknown'; line?: Side[] } {
  interface Node { index: number; stats: Stats; parent: Node | null; side: Side | null }
  const seen = new Set<string>();
  const queue: Node[] = [{ index: 0, stats: startStats(), parent: null, side: null }];
  let head = 0;
  let states = 0;
  while (head < queue.length) {
    const node = queue[head++];
    const key = stateKey(node.index, node.stats);
    if (seen.has(key)) continue;
    seen.add(key);
    if (++states > STATE_CAP) return { result: 'unknown' };
    for (const side of ['leftChoice', 'rightChoice'] as Side[]) {
      const r = step(deck, node.index, node.stats, side, difficulty);
      if (r.outcome === target) {
        const line: Side[] = [side];
        for (let cur: Node | null = node; cur && cur.side; cur = cur.parent) line.unshift(cur.side);
        return { result: 'yes', line };
      }
      if (r.outcome === 'continue') {
        queue.push({ index: r.nextIndex, stats: r.stats, parent: node, side });
      }
    }
  }
  return { result: 'no' };
}

/** Monte Carlo: fraction of uniformly-random playthroughs that win. */
export function randomSurvival(deck: Deck, difficulty: Difficulty, runs = 4000): number {
  let wins = 0;
  for (let run = 0; run < runs; run++) {
    let index = 0;
    let stats = startStats();
    let safety = 400;
    for (;;) {
      if (--safety === 0) break;
      const side: Side = Math.random() < 0.5 ? 'leftChoice' : 'rightChoice';
      const r = step(deck, index, stats, side, difficulty);
      if (r.outcome === 'win') { wins++; break; }
      if (r.outcome === 'lose') break;
      index = r.nextIndex;
      stats = r.stats;
    }
  }
  return wins / runs;
}

/** Which card indices can reach the ending at all, ignoring stats (pure wiring). */
function endReachingCards(deck: Deck): Set<number> {
  const n = deck.cards.length;
  const reachesEnd = new Set<number>();
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < n; i++) {
      if (reachesEnd.has(i)) continue;
      for (const side of ['leftChoice', 'rightChoice'] as Side[]) {
        const jump = deck.cards[i][side].nextCardIndex;
        const next = typeof jump === 'number' ? jump : i + 1;
        if (next >= n || (next >= 0 && reachesEnd.has(next))) {
          reachesEnd.add(i);
          changed = true;
          break;
        }
      }
    }
  }
  return reachesEnd;
}

export interface DifficultyAnalysis {
  difficulty: Difficulty;
  winnable: 'yes' | 'no' | 'unknown';
  losable: 'yes' | 'no' | 'unknown';
  survival: number;
  winningLine?: Side[];
}

export interface DeckAnalysis {
  perDifficulty: DifficultyAnalysis[];
  suggestions: string[];
}

export function analyzeDeck(deck: Deck): DeckAnalysis {
  const perDifficulty: DifficultyAnalysis[] = DIFFICULTIES.map(difficulty => {
    const win = reachable(deck, difficulty, 'win');
    const lose = reachable(deck, difficulty, 'lose');
    return {
      difficulty,
      winnable: win.result,
      losable: lose.result,
      survival: randomSurvival(deck, difficulty),
      winningLine: win.line,
    };
  });

  const suggestions: string[] = [];
  const unwinnable = perDifficulty.filter(d => d.winnable === 'no');
  const unlosable = perDifficulty.filter(d => d.losable === 'no');

  if (unwinnable.length > 0) {
    const reaching = endReachingCards(deck);
    const stranded = deck.cards.map((_, i) => i).filter(i => !reaching.has(i));
    if (!reaching.has(0)) {
      suggestions.push(
        `No sequence of choices can reach the ending — this is a wiring problem, not balance. ` +
        `Cards that can never reach the final card: ${stranded.map(i => `#${i + 1}`).join(', ') || 'none reachable'}. ` +
        `Rewire a jump from one of them toward card #${deck.cards.length} (or a card that leads there).`
      );
    } else {
      const at = unwinnable.map(d => d.difficulty).join(', ');
      // Harshest swings on the deck — the usual culprits for stat-death
      const harshest = deck.cards
        .flatMap((card, i) => (['leftChoice', 'rightChoice'] as Side[]).flatMap(side =>
          STAT_KEYS.map(stat => ({
            label: `card #${i + 1} ${side === 'leftChoice' ? '⇦' : '⇨'} (${stat} ${card[side].effects[stat]! > 0 ? '+' : ''}${card[side].effects[stat] || 0})`,
            magnitude: Math.abs(card[side].effects[stat] || 0),
          }))))
        .sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, 3);
      suggestions.push(
        `The wiring reaches the ending, but every route dies from stat pressure at: ${at}. ` +
        `Softening the harshest swings usually opens a path — biggest offenders: ${harshest.map(h => h.label).join(', ')}.`
      );
    }
  }
  if (unlosable.length > 0) {
    suggestions.push(
      `Impossible to lose at: ${unlosable.map(d => d.difficulty).join(', ')} — no run can push any stat to ` +
      `${MIN_STAT_VALUE} or ${MAX_STAT_VALUE}. Strengthen some effects (±20–35 territory) so the pressure is real.`
    );
  }
  for (const d of perDifficulty) {
    if (d.winnable === 'yes' && d.survival < 0.02) {
      suggestions.push(`${d.difficulty}: winnable but brutal (${(d.survival * 100).toFixed(1)}% random-play survival) — fine for a gauntlet, punishing for a first deck.`);
    }
    if (d.losable === 'yes' && d.survival > 0.9) {
      suggestions.push(`${d.difficulty}: very forgiving (${(d.survival * 100).toFixed(0)}% random-play survival) — consider sharpening a few effects.`);
    }
  }
  if (suggestions.length === 0) {
    suggestions.push('Deck is winnable and losable at every difficulty, with a sane challenge curve. Ship it.');
  }

  return { perDifficulty, suggestions };
}

/** Quick per-difficulty survival for menu hints (fixed decks only). */
export function deckSurvival(deck: Deck): Record<Difficulty, number> {
  return {
    easy: randomSurvival(deck, 'easy', 2500),
    standard: randomSurvival(deck, 'standard', 2500),
    hard: randomSurvival(deck, 'hard', 2500),
  };
}
