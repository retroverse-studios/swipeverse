# Deck State Roadmap — what the engine can express, and what it deliberately can't yet

_Drafted 2026-07-22, alongside shipping stat-conditional branches._

## Guiding constraint (the decision)

**Provable winnability is the product.** The Analyze button and the store's
generation gate rest on an exhaustive BFS over game states
(`services/deckSolver.ts`, mirrored in `scripts/deck-solver.mjs`). Any
deck-schema feature must keep that search tractable, or it doesn't ship.
Expressiveness is added only when a real deck hits the wall of the current
model — not speculatively.

## Current state model (as shipped)

Game state = `(current card index, four stats 0–100)`. Navigation after a
choice's effects apply, resolved by `services/branching.ts`
(single source of truth for engine + solver):

1. first matching stat branch (`branches: [{stat, gte?, lte?, nextCardIndex}]`, author order)
2. the choice's static `nextCardIndex`
3. sequential (`index + 1`)

This already gives: jumps, loops, and **loops you must earn your way out of**
(branch gated on an accumulated stat). Solver state space stays
`cards × 101⁴` (bounded in practice by the reachable frontier and the
`STATE_CAP` valve).

## Future expansion (deferred, in rough order of value)

### 1. Set-on-visit markers / hidden flags

Boolean path memory: "player visited card 7" or a named marker a choice sets
(`has_seal`), branchable later. **New expressive power, not sugar** — stats
are a lossy memory (perturbed by every choice, difficulty-scaled, clamped),
so "took the seal at card 0" is unrecoverable ten cards later. Today authors
can only fake booleans by encoding them into stat arithmetic, which fights
balance tuning.

Cost: each flag **doubles** solver state space (n flags → 2ⁿ×). If added:
cap flags per deck hard (≤ 6–8), validate the cap in both the store
`validate.mjs` and the app, and re-verify STATE_CAP headroom against the
worst store deck.

Signal to build it: the first real deck that fakes a boolean with a stat
delta (e.g. "+7 Knowledge means they have the map").

### 2. Per-card entry gates

Condition on the *incoming* card, not the outgoing choice: "entering the
library requires Knowledge ≥ 40, else redirect to card 12". For stat
conditions this is mostly the same routing expressed once instead of on
every inbound arrow — its value is single-point-of-truth (a later-added jump
into the card can't forget the check; the solver can't catch that omission
because the deck stays winnable, just narratively wrong). Becomes more than
sugar once flags exist ("throne room requires `has_seal`" — inexpressible at
choice level).

Solver impact: none on state-space size (it's routing, not state). Editor
impact: a per-card condition row; VisualEditor should render the gate on the
node, not the edges.

### Non-goals

Arbitrary variables, text interpolation, scripted logic. The smallness —
two choices, four stats, threshold routing — is what keeps decks authorable
in a form editor, decidable by the solver, and reviewable as store
submissions.
