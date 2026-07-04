/**
 * Generates the bundled starter decks (decks/<realityId>.json) with Claude.
 *
 * Usage:  ANTHROPIC_API_KEY=... node scripts/generate-decks.mjs [realityId ...]
 * With no args, generates all three built-in realities.
 *
 * Mirrors the app's Story Director prompt (services/aiProvider.ts) and
 * validation (validateAndRepairDeck), then writes bare-Deck JSON files that
 * decks/index.ts picks up at build time. Generated cards deliberately carry
 * no imageUrl — the game assigns each reality's stock imageSet at runtime.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DECK_SIZE = 20;
const MAX_EFFECT = 50;
const STAT_NAMES = ["Power", "Wealth", "People", "Knowledge"];
const ARCHETYPES = ["petitioner", "crisis", "opportunity", "faction", "advisor", "chain", "judgement", "gamble", "terminal"];
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "decks");

// Kept in sync by hand with REALITIES in constants.tsx (that file is TSX and
// can't be imported from a plain Node script).
const REALITIES = [
    {
        id: "cyberpunk",
        name: "Cyberpunk Dystopia",
        systemInstruction: `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios for a player in a Cyberpunk Dystopia. The player's goal is to balance four stats: Corporate Power, Street Cred, Citizen Trust, and Banned Tech. If any stat reaches 0 or 100, the player loses.`,
        statNames: { Power: "Corp. Power", Wealth: "Street Cred", People: "Citizen Trust", Knowledge: "Banned Tech" },
        storyPrompt: "The player is a mid-level fixer in a corporate-owned megacity who has just come into possession of a prototype neural implant that every faction wants. Weave a story of shifting alliances between the corp that made it, the street gangs who want it copied, the citizens caught in the crossfire, and the black-market techs who can unlock it. Choices should force trades between corporate favor, street reputation, public trust, and forbidden technology.",
    },
    {
        id: "mystical",
        name: "Mystical Kingdom",
        systemInstruction: `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios for a player ruling a Mystical Kingdom. The player's goal is to balance four stats: Royal Authority, Kingdom's Treasury, People's Favor, and Arcane Lore. If any stat reaches 0 or 100, the player loses.`,
        statNames: { Power: "Authority", Wealth: "Treasury", People: "Favor", Knowledge: "Arcane Lore" },
        storyPrompt: "The player is a newly crowned monarch in a kingdom where the old magic is waking after centuries of sleep. Ancient wards are failing, a dragon has been sighted beyond the mountains, the mage guild demands independence, and the harvest depends on rites the crown half-remembers. Weave court intrigue, folk superstition, and real sorcery into decisions that trade royal authority, gold, the people's love, and dangerous arcane knowledge against one another.",
    },
    {
        id: "space",
        name: "Galactic Imperium",
        systemInstruction: `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios for a player leading a Galactic Imperium. The player's goal is to balance four stats: Fleet Strength, Galactic Credits, Alien Relations, and Precursor Data. If any stat reaches 0 or 100, the player loses.`,
        statNames: { Power: "Fleet", Wealth: "Credits", People: "Relations", Knowledge: "Precursor Data" },
        storyPrompt: "The player commands a star-spanning imperium whose survey ships have found a dormant precursor megastructure at the rim of known space. Rival houses want it weaponized, alien neighbors call it sacred ground, the treasury strains under the expedition's cost, and every fragment of precursor data changes the balance of power. Weave exploration, diplomacy, mutiny, and discovery into choices that trade fleet strength, credits, alien relations, and precursor knowledge.",
    },
];

// Mirrors buildBranchingDeckPrompt in services/aiProvider.ts (minus the JSON
// schema block — structured outputs enforce the shape instead).
function buildPrompt(reality) {
    return `
A story creator wants a deck of ${DECK_SIZE} cards for the game based on this high-level prompt: "${reality.storyPrompt}".
Generate a full, unique, and challenging deck of ${DECK_SIZE} scenario cards that follows the creator's prompt.
Give the generated deck a cool, thematic name based on the prompt, and write a one-sentence synopsis as the deck's description.
Create a branching narrative using the 'nextCardIndex' property on choices to make the story interactive and replayable. Make sure jumps are valid (within the 0 to ${DECK_SIZE - 1} range). The final card in the array (index ${DECK_SIZE - 1}) should be the 'win' or final ending card.
The choices should have plausible but non-obvious consequences.
Stat changes should generally be between -35 and +35. Balance matters: this is the first deck a new player experiences, so avoid choices where several stats swing hard in the same direction, and make sure a player who mixes left and right choices can plausibly survive to the final card.
Ensure the prompts are engaging, varied, and fit the ${reality.name} theme.
The Power stat is named ${reality.statNames.Power}.
The Wealth stat is named ${reality.statNames.Wealth}.
The People stat is named ${reality.statNames.People}.
The Knowledge stat is named ${reality.statNames.Knowledge}.
Tag each card with an "archetype" that best matches it: petitioner (someone asks you for something), crisis (something bad happens to you), opportunity (a windfall or offer), faction (a power bloc acts), advisor (information or a warning), chain (part of a multi-card storyline), judgement (two parties in dispute and you pick a side), gamble (uncertain outcome), terminal (endings, death, collapse). Most decks are roughly half petitioner cards.

Generate exactly ${DECK_SIZE} cards.
`.trim();
}

const effectsSchema = {
    type: "object",
    properties: Object.fromEntries(STAT_NAMES.map(s => [s, { type: "integer" }])),
    required: STAT_NAMES,
    additionalProperties: false,
};

const choiceSchema = {
    type: "object",
    properties: {
        text: { type: "string" },
        effects: effectsSchema,
        nextCardIndex: { type: "integer" },
    },
    required: ["text", "effects"],
    additionalProperties: false,
};

const deckSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        description: { type: "string" },
        cards: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    prompt: { type: "string" },
                    archetype: { type: "string", enum: ARCHETYPES },
                    leftChoice: choiceSchema,
                    rightChoice: choiceSchema,
                },
                required: ["prompt", "leftChoice", "rightChoice"],
                additionalProperties: false,
            },
        },
    },
    required: ["name", "description", "cards"],
    additionalProperties: false,
};

// Port of validateAndRepairDeck (services/aiProvider.ts) for Node.
function validateAndRepairDeck(deck) {
    if (!deck || !Array.isArray(deck.cards)) throw new Error("No card deck in response");
    const deckSize = deck.cards.length;
    const sanitizeChoice = (choice) => {
        if (!choice || typeof choice.text !== "string" || choice.text.trim() === "") return null;
        const effects = {};
        for (const stat of STAT_NAMES) {
            const value = Number(choice.effects?.[stat]);
            effects[stat] = Number.isFinite(value) ? Math.max(-MAX_EFFECT, Math.min(MAX_EFFECT, Math.round(value))) : 0;
        }
        const clean = { text: choice.text, effects };
        if (Number.isInteger(choice.nextCardIndex) && choice.nextCardIndex >= 0 && choice.nextCardIndex < deckSize) {
            clean.nextCardIndex = choice.nextCardIndex;
        }
        return clean;
    };
    const cards = [];
    for (const card of deck.cards) {
        if (!card || typeof card.prompt !== "string" || card.prompt.trim() === "") continue;
        const leftChoice = sanitizeChoice(card.leftChoice);
        const rightChoice = sanitizeChoice(card.rightChoice);
        if (!leftChoice || !rightChoice) continue;
        const clean = { prompt: card.prompt, leftChoice, rightChoice };
        if (ARCHETYPES.includes(card.archetype)) clean.archetype = card.archetype;
        cards.push(clean);
    }
    if (cards.length === 0) throw new Error("No playable cards");
    if (cards.length !== deckSize) {
        for (const card of cards) {
            delete card.leftChoice.nextCardIndex;
            delete card.rightChoice.nextCardIndex;
        }
    }
    return { name: deck.name, description: deck.description, cards };
}

// Rough balance report: cumulative stat drift if the player always swipes one way.
function balanceReport(deck) {
    const drift = (side) => {
        const totals = Object.fromEntries(STAT_NAMES.map(s => [s, 0]));
        for (const card of deck.cards) {
            for (const stat of STAT_NAMES) totals[stat] += card[side].effects[stat];
        }
        return totals;
    };
    const fmt = (t) => STAT_NAMES.map(s => `${s} ${t[s] >= 0 ? "+" : ""}${t[s]}`).join(", ");
    return `    all-left drift:  ${fmt(drift("leftChoice"))}\n    all-right drift: ${fmt(drift("rightChoice"))}`;
}

const client = new Anthropic();

async function generateDeck(reality) {
    console.log(`\nGenerating "${reality.name}" (${reality.id})...`);
    const stream = client.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 32000,
        thinking: { type: "adaptive" },
        system: reality.systemInstruction,
        output_config: { format: { type: "json_schema", schema: deckSchema } },
        messages: [{ role: "user", content: buildPrompt(reality) }],
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") throw new Error("Request was refused");
    if (message.stop_reason === "max_tokens") throw new Error("Output truncated (max_tokens)");
    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    const deck = validateAndRepairDeck(JSON.parse(text));

    const outPath = join(OUT_DIR, `${reality.id}.json`);
    writeFileSync(outPath, JSON.stringify(deck, null, 2) + "\n");
    const branches = deck.cards.filter(c => c.leftChoice.nextCardIndex !== undefined || c.rightChoice.nextCardIndex !== undefined).length;
    console.log(`  "${deck.name}" — ${deck.cards.length} cards, ${branches} with branch jumps -> ${outPath}`);
    console.log(balanceReport(deck));
    return deck;
}

mkdirSync(OUT_DIR, { recursive: true });
const wanted = process.argv.slice(2);
const targets = wanted.length > 0 ? REALITIES.filter(r => wanted.includes(r.id)) : REALITIES;
if (targets.length === 0) {
    console.error(`Unknown reality id(s): ${wanted.join(", ")}. Known: ${REALITIES.map(r => r.id).join(", ")}`);
    process.exit(1);
}
for (const reality of targets) {
    await generateDeck(reality);
}
console.log("\nDone. Playtest before shipping: npm run dev");
