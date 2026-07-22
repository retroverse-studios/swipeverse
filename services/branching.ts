/**
 * Next-card resolution — the single source of truth for deck navigation,
 * shared by the game engine (GameScreen) and the solver (deckSolver) so the
 * two can never disagree. scripts/deck-solver.mjs mirrors this in plain JS.
 *
 * Order of precedence after a swipe's effects are applied:
 *   1. first matching stat branch (checked in author order)
 *   2. the choice's static nextCardIndex
 *   3. sequential (current card + 1)
 */

import { Choice, StatBranch, Stats } from '../types';

export function branchMatches(branch: StatBranch, stats: Stats): boolean {
  const value = stats[branch.stat];
  if (typeof value !== 'number') return false;
  if (branch.gte === undefined && branch.lte === undefined) return false;
  if (branch.gte !== undefined && value < branch.gte) return false;
  if (branch.lte !== undefined && value > branch.lte) return false;
  return true;
}

export function resolveNextIndex(choice: Choice, statsAfterEffects: Stats, currentIndex: number): number {
  for (const branch of choice.branches ?? []) {
    if (branchMatches(branch, statsAfterEffects)) return branch.nextCardIndex;
  }
  if (typeof choice.nextCardIndex === 'number') return choice.nextCardIndex;
  return currentIndex + 1;
}

/** Every index a choice could possibly lead to, ignoring stats (pure wiring). */
export function possibleNextIndices(choice: Choice, currentIndex: number): number[] {
  const targets = (choice.branches ?? []).map(branch => branch.nextCardIndex);
  targets.push(typeof choice.nextCardIndex === 'number' ? choice.nextCardIndex : currentIndex + 1);
  return [...new Set(targets)];
}
