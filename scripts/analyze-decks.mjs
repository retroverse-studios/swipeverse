/**
 * Deck balance analyzer — answers, per difficulty, using the game's exact
 * rules (clamp 0..100, lose on <=0 or >=100 after a choice, win by advancing
 * past the final card, Math.round(effect * modifier)):
 *
 *   1. Is the deck WINNABLE?  (exists a choice sequence that survives to the end)
 *   2. Is the deck LOSABLE?   (exists a choice sequence that dies — if not,
 *      the deck is toothless at that difficulty)
 *   3. Random-play survival % (Monte Carlo) — a difficulty-calibration signal.
 *
 * Usage: node scripts/analyze-decks.mjs [deckFile.json ...]   (default: decks/*.json)
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DIFFICULTY_MODIFIERS, reachable, randomSurvival } from "./deck-solver.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const files = args.length > 0
    ? args
    : readdirSync(join(ROOT, "decks"))
        .filter(f => f.endsWith(".json") && !f.startsWith("._")) // ignore macOS AppleDouble junk
        .map(f => join("decks", f));

let problems = 0;
for (const file of files) {
    const deck = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
    console.log(`\n${file} — "${deck.name}" (${deck.cards.length} cards)`);
    for (const [difficulty, modifier] of Object.entries(DIFFICULTY_MODIFIERS)) {
        const win = reachable(deck, modifier, "win");
        const lose = reachable(deck, modifier, "lose");
        const survival = randomSurvival(deck, modifier);
        const flags = [];
        if (win.result === "no") { flags.push("UNWINNABLE"); problems++; }
        if (lose.result === "no") { flags.push("UNLOSABLE (toothless)"); problems++; }
        if (survival < 0.02 && win.result === "yes") flags.push("brutal for random play");
        if (survival > 0.9 && lose.result === "yes") flags.push("very forgiving");
        console.log(
            `  ${difficulty.padEnd(8)} winnable: ${win.result.padEnd(3)}  losable: ${lose.result.padEnd(3)}  ` +
            `random-play survival: ${(survival * 100).toFixed(1).padStart(5)}%` +
            (flags.length ? `   ⚠ ${flags.join(", ")}` : "")
        );
    }
}
if (problems > 0) {
    console.error(`\n${problems} hard problem(s) found (unwinnable or unlosable difficulty).`);
    process.exit(1);
}
console.log("\nAll decks winnable and losable at every difficulty.");
