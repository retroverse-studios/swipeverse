import { Reality, Stats, Deck, CARD_ARCHETYPES, CardArchetype } from "../types";
import { DECK_SIZE } from "../constants";

const ARCHETYPE_GUIDE = `Tag each card with an "archetype" that best matches it: petitioner (someone asks you for something), crisis (something bad happens to you), opportunity (a windfall or offer), faction (a power bloc acts), advisor (information or a warning), chain (part of a multi-card storyline), judgement (two parties in dispute and you pick a side), gamble (uncertain outcome), terminal (endings, death, collapse). Most decks are roughly half petitioner cards.`;

// ─── Provider Interface ──────────────────────────────────────────

export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'openrouter' | 'grok' | 'compatible' | 'ollama';

export interface AIProvider {
    readonly name: string;
    readonly type: AIProviderType;
    generateDeck(prompt: string, systemInstruction: string): Promise<Deck>;
}

// ─── Shared Prompt Builders ──────────────────────────────────────

export function buildInitialDeckPrompt(reality: Reality, currentStats: Stats, deckSize: number = DECK_SIZE): string {
    const statsSummary = Object.entries(currentStats)
        .map(([key, value]) => `${reality.statNames[key as keyof Stats]}: ${value}`)
        .join(', ');

    return `
The player is starting a new game with this situation: ${statsSummary}.
Generate a full, unique, and challenging deck of ${deckSize} scenario cards for the game.
The choices should have plausible but non-obvious consequences.
Stat changes should generally be between -35 and +35.
Ensure the prompts are engaging, varied, and fit the ${reality.name} theme. Do not repeat scenarios within the deck.
Give the deck a cool, thematic name and a one-sentence synopsis.
Optionally create branching narratives by setting the 'nextCardIndex' property on choices to jump to other cards. If you create branches, ensure they create an interesting, potentially looping story. The final card in the deck is the win condition.
For richer stories you may also add stat-conditional 'branches' to a choice: each branch names a stat and a threshold (gte and/or lte, values 0-100) plus a nextCardIndex; after the choice's effects apply, the first matching branch decides the next card, falling back to nextCardIndex (or the next sequential card) when none match. Use this sparingly for dramatic forks — e.g. a ruler with Wealth >= 60 is received at court, a poorer one is turned away — and to gate exits from loops behind an earned stat.
The Power stat is named ${reality.statNames.Power}.
The Wealth stat is named ${reality.statNames.Wealth}.
The People stat is named ${reality.statNames.People}.
The Knowledge stat is named ${reality.statNames.Knowledge}.
${ARCHETYPE_GUIDE}

Respond with a JSON object matching this exact schema:
{
  "name": "string - A cool thematic title for this deck",
  "description": "string - A one-sentence synopsis",
  "cards": [
    {
      "prompt": "string - The scenario text",
      "archetype": "string (optional) - one of: petitioner|crisis|opportunity|faction|advisor|chain|judgement|gamble|terminal",
      "imageUrl": "string (optional) - URL to a relevant image",
      "leftChoice": {
        "text": "string - Brief choice text",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "branches": [ { "stat": "Power|Wealth|People|Knowledge", "gte": number (optional), "lte": number (optional), "nextCardIndex": number } ] (optional),
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      },
      "rightChoice": {
        "text": "string - Brief choice text",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "branches": [ { "stat": "Power|Wealth|People|Knowledge", "gte": number (optional), "lte": number (optional), "nextCardIndex": number } ] (optional),
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      }
    }
  ]
}

Generate exactly ${deckSize} cards.
`.trim();
}

export function buildBranchingDeckPrompt(reality: Reality, storyPrompt: string, sourceMaterial?: string, deckSize: number = DECK_SIZE): string {
    const sourceBlock = sourceMaterial?.trim() ? `
Ground the deck in the following SOURCE MATERIAL. Draw the scenarios, terminology, characters and stakes from it faithfully.
If it is educational material (lecture notes, a workshop, a tutorial, a case study), extract its key concepts, tensions and trade-offs and turn them into dilemma cards that make the player exercise judgment about the material — decisions with defensible arguments on both sides and consequences that teach — never recall quizzes.
--- SOURCE MATERIAL START ---
${sourceMaterial.trim()}
--- SOURCE MATERIAL END ---
` : '';
    return `
A story creator wants a deck of ${deckSize} cards for the game based on this high-level prompt: "${storyPrompt}".
${sourceBlock}
Generate a full, unique, and challenging deck of ${deckSize} scenario cards that follows the creator's prompt.
Give the generated deck a cool, thematic name based on the prompt, and use the prompt itself as the deck's description.
Create a branching narrative using the 'nextCardIndex' property on choices to make the story interactive and replayable. Make sure jumps are valid (within the 0 to ${deckSize - 1} range). The final card in the array (index ${deckSize - 1}) should be the 'win' or final ending card.
For richer stories you may also add stat-conditional 'branches' to a choice: each branch names a stat and a threshold (gte and/or lte, values 0-100) plus a nextCardIndex; after the choice's effects apply, the first matching branch decides the next card, falling back to nextCardIndex (or the next sequential card) when none match. Use this sparingly for dramatic forks and to gate exits from loops behind an earned stat.
The choices should have plausible but non-obvious consequences.
Stat changes should generally be between -35 and +35.
Ensure the prompts are engaging, varied, and fit the ${reality.name} theme.
The Power stat is named ${reality.statNames.Power}.
The Wealth stat is named ${reality.statNames.Wealth}.
The People stat is named ${reality.statNames.People}.
The Knowledge stat is named ${reality.statNames.Knowledge}.
${ARCHETYPE_GUIDE}

Respond with a JSON object matching this exact schema:
{
  "name": "string - A cool thematic title",
  "description": "string - The story synopsis",
  "cards": [
    {
      "prompt": "string - The scenario text",
      "archetype": "string (optional) - one of: petitioner|crisis|opportunity|faction|advisor|chain|judgement|gamble|terminal",
      "imageUrl": "string (optional)",
      "leftChoice": {
        "text": "string",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "branches": [ { "stat": "Power|Wealth|People|Knowledge", "gte": number (optional), "lte": number (optional), "nextCardIndex": number } ] (optional),
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      },
      "rightChoice": {
        "text": "string",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "branches": [ { "stat": "Power|Wealth|People|Knowledge", "gte": number (optional), "lte": number (optional), "nextCardIndex": number } ] (optional),
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      }
    }
  ]
}

Generate exactly ${deckSize} cards.
`.trim();
}

// ─── JSON Parsing Helper ─────────────────────────────────────────

export function parseDeckFromResponse(text: string): Deck {
    // Try direct JSON parse first
    try {
        const parsed = JSON.parse(text);
        if (parsed.cards && Array.isArray(parsed.cards)) return parsed as Deck;
    } catch { /* fall through */ }

    // Extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.cards && Array.isArray(parsed.cards)) return parsed as Deck;
    }

    // Last resort: find first { ... } block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
        const parsed = JSON.parse(braceMatch[0]);
        if (parsed.cards && Array.isArray(parsed.cards)) return parsed as Deck;
    }

    throw new Error("Could not parse deck from AI response");
}

// ─── Deck Validation ─────────────────────────────────────────────

const STAT_NAMES: (keyof Stats)[] = ['Power', 'Wealth', 'People', 'Knowledge'];
const MAX_EFFECT = 50;

function sanitizeChoice(choice: unknown, deckSize: number): Deck['cards'][number]['leftChoice'] | null {
    if (!choice || typeof choice !== 'object') return null;
    const c = choice as Record<string, unknown>;
    if (typeof c.text !== 'string' || c.text.trim() === '') return null;

    const rawEffects = (c.effects && typeof c.effects === 'object' ? c.effects : {}) as Record<string, unknown>;
    const effects: Partial<Stats> = {};
    for (const stat of STAT_NAMES) {
        const value = Number(rawEffects[stat]);
        effects[stat] = Number.isFinite(value)
            ? Math.max(-MAX_EFFECT, Math.min(MAX_EFFECT, Math.round(value)))
            : 0;
    }

    const sanitized: Deck['cards'][number]['leftChoice'] = { text: c.text, effects };
    // Only keep branch jumps that land inside the deck; a bad index would end the game early
    const nextIndex = Number(c.nextCardIndex);
    if (Number.isInteger(nextIndex) && nextIndex >= 0 && nextIndex < deckSize) {
        sanitized.nextCardIndex = nextIndex;
    }
    if (typeof c.soundUrl === 'string' && c.soundUrl) sanitized.soundUrl = c.soundUrl;
    return sanitized;
}

/**
 * Validates an AI-generated deck, repairing what it can (clamping stat effects,
 * dropping out-of-range branch jumps) and discarding cards that are unusable.
 * Throws if nothing playable remains.
 */
export function validateAndRepairDeck(deck: Deck): Deck {
    if (!deck || !Array.isArray(deck.cards)) {
        throw new Error("The AI response did not contain a card deck.");
    }
    const deckSize = deck.cards.length;
    const cards: Deck['cards'] = [];
    for (const card of deck.cards) {
        if (!card || typeof card.prompt !== 'string' || card.prompt.trim() === '') continue;
        const leftChoice = sanitizeChoice(card.leftChoice, deckSize);
        const rightChoice = sanitizeChoice(card.rightChoice, deckSize);
        if (!leftChoice || !rightChoice) continue;
        cards.push({
            prompt: card.prompt,
            ...(CARD_ARCHETYPES.includes(card.archetype as CardArchetype) ? { archetype: card.archetype } : {}),
            ...(typeof card.imageUrl === 'string' && card.imageUrl ? { imageUrl: card.imageUrl } : {}),
            leftChoice,
            rightChoice,
        });
    }
    if (cards.length === 0) {
        throw new Error("The AI returned a deck with no playable cards.");
    }
    // Dropping cards shifts indices, so surviving branch jumps would point at the
    // wrong cards — fall back to linear progression in that case
    if (cards.length !== deckSize) {
        for (const card of cards) {
            delete card.leftChoice.nextCardIndex;
            delete card.rightChoice.nextCardIndex;
        }
    }
    return { name: deck.name, description: deck.description, cards };
}
