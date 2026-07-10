/**
 * Exact deck solver — shared by generate-decks.mjs (reject/retry) and
 * analyze-decks.mjs (reporting). Replicates the game's rules precisely:
 * clamp 0..100, lose when any stat hits <=0 or >=100 after a choice,
 * win by advancing past the final card, Math.round(effect * modifier).
 */

export const DIFFICULTY_MODIFIERS = { easy: 0.7, standard: 1.0, hard: 1.3 };
const STATS = ["Power", "Wealth", "People", "Knowledge"];
const START = 50;

export function step(deck, cardIndex, stats, side, modifier) {
    const choice = deck.cards[cardIndex][side];
    const next = { ...stats };
    let dead = false;
    for (const stat of STATS) {
        const raw = choice.effects[stat] || 0;
        const value = Math.max(0, Math.min(100, next[stat] + Math.round(raw * modifier)));
        next[stat] = value;
        if (value <= 0 || value >= 100) dead = true;
    }
    if (dead) return { outcome: "lose", stats: next };
    const nextIndex = typeof choice.nextCardIndex === "number" ? choice.nextCardIndex : cardIndex + 1;
    if (nextIndex >= deck.cards.length) return { outcome: "win", stats: next };
    if (nextIndex < 0) return { outcome: "lose", stats: next };
    return { outcome: "continue", stats: next, nextIndex };
}

/** Exhaustive search with memo on (cardIndex, stats): can any play reach `target`? */
export function reachable(deck, modifier, target) {
    const seen = new Set();
    const stack = [{ index: 0, stats: { Power: START, Wealth: START, People: START, Knowledge: START } }];
    let states = 0;
    while (stack.length > 0) {
        const { index, stats } = stack.pop();
        const key = `${index}:${stats.Power},${stats.Wealth},${stats.People},${stats.Knowledge}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (++states > 2_000_000) return { result: "unknown", states }; // safety valve
        for (const side of ["leftChoice", "rightChoice"]) {
            const r = step(deck, index, stats, side, modifier);
            if (r.outcome === target) return { result: "yes", states };
            if (r.outcome === "continue") stack.push({ index: r.nextIndex, stats: r.stats });
        }
    }
    return { result: "no", states };
}

/** Monte Carlo: fraction of uniformly-random playthroughs that win. */
export function randomSurvival(deck, modifier, runs = 20000) {
    let wins = 0;
    for (let run = 0; run < runs; run++) {
        let index = 0;
        let stats = { Power: START, Wealth: START, People: START, Knowledge: START };
        let safety = 500;
        for (;;) {
            if (--safety === 0) break;
            const side = Math.random() < 0.5 ? "leftChoice" : "rightChoice";
            const r = step(deck, index, stats, side, modifier);
            if (r.outcome === "win") { wins++; break; }
            if (r.outcome === "lose") break;
            index = r.nextIndex;
            stats = r.stats;
        }
    }
    return wins / runs;
}

/**
 * The gate used by generation: playable means winnable AND losable at every
 * difficulty. Returns { ok, failures: string[] }.
 */
export function checkPlayable(deck) {
    const failures = [];
    for (const [difficulty, modifier] of Object.entries(DIFFICULTY_MODIFIERS)) {
        if (reachable(deck, modifier, "win").result !== "yes") failures.push(`unwinnable at ${difficulty}`);
        if (reachable(deck, modifier, "lose").result !== "yes") failures.push(`unlosable at ${difficulty}`);
    }
    return { ok: failures.length === 0, failures };
}
