import { Reality, Stats, Deck } from "../types";
import { DECK_SIZE } from "../constants";

// ─── Provider Interface ──────────────────────────────────────────

export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'ollama';

export interface AIProvider {
    readonly name: string;
    readonly type: AIProviderType;
    generateDeck(prompt: string, systemInstruction: string): Promise<Deck>;
}

// ─── Shared Prompt Builders ──────────────────────────────────────

export function buildInitialDeckPrompt(reality: Reality, currentStats: Stats): string {
    const statsSummary = Object.entries(currentStats)
        .map(([key, value]) => `${reality.statNames[key as keyof Stats]}: ${value}`)
        .join(', ');

    return `
The player is starting a new game with this situation: ${statsSummary}.
Generate a full, unique, and challenging deck of ${DECK_SIZE} scenario cards for the game.
The choices should have plausible but non-obvious consequences.
Stat changes should generally be between -35 and +35.
Ensure the prompts are engaging, varied, and fit the ${reality.name} theme. Do not repeat scenarios within the deck.
Give the deck a cool, thematic name and a one-sentence synopsis.
Optionally create branching narratives by setting the 'nextCardIndex' property on choices to jump to other cards. If you create branches, ensure they create an interesting, potentially looping story. The final card in the deck is the win condition.
The Power stat is named ${reality.statNames.Power}.
The Wealth stat is named ${reality.statNames.Wealth}.
The People stat is named ${reality.statNames.People}.
The Knowledge stat is named ${reality.statNames.Knowledge}.

Respond with a JSON object matching this exact schema:
{
  "name": "string - A cool thematic title for this deck",
  "description": "string - A one-sentence synopsis",
  "cards": [
    {
      "prompt": "string - The scenario text",
      "imageUrl": "string (optional) - URL to a relevant image",
      "leftChoice": {
        "text": "string - Brief choice text",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      },
      "rightChoice": {
        "text": "string - Brief choice text",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      }
    }
  ]
}

Generate exactly ${DECK_SIZE} cards.
`.trim();
}

export function buildBranchingDeckPrompt(reality: Reality, storyPrompt: string): string {
    return `
A story creator wants a deck of ${DECK_SIZE} cards for the game based on this high-level prompt: "${storyPrompt}".
Generate a full, unique, and challenging deck of ${DECK_SIZE} scenario cards that follows the creator's prompt.
Give the generated deck a cool, thematic name based on the prompt, and use the prompt itself as the deck's description.
Create a branching narrative using the 'nextCardIndex' property on choices to make the story interactive and replayable. Make sure jumps are valid (within the 0 to ${DECK_SIZE - 1} range). The final card in the array (index ${DECK_SIZE - 1}) should be the 'win' or final ending card.
The choices should have plausible but non-obvious consequences.
Stat changes should generally be between -35 and +35.
Ensure the prompts are engaging, varied, and fit the ${reality.name} theme.
The Power stat is named ${reality.statNames.Power}.
The Wealth stat is named ${reality.statNames.Wealth}.
The People stat is named ${reality.statNames.People}.
The Knowledge stat is named ${reality.statNames.Knowledge}.

Respond with a JSON object matching this exact schema:
{
  "name": "string - A cool thematic title",
  "description": "string - The story synopsis",
  "cards": [
    {
      "prompt": "string - The scenario text",
      "imageUrl": "string (optional)",
      "leftChoice": {
        "text": "string",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      },
      "rightChoice": {
        "text": "string",
        "effects": { "Power": number, "Wealth": number, "People": number, "Knowledge": number },
        "nextCardIndex": number (optional),
        "soundUrl": "string (optional)"
      }
    }
  ]
}

Generate exactly ${DECK_SIZE} cards.
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

// ─── Fallback Deck ───────────────────────────────────────────────

export const FALLBACK_DECK: Deck = {
    name: "Fallback Protocol",
    description: "A connection to the multiverse was lost.",
    cards: [{
        prompt: "A cosmic anomaly disrupts your connection to the multiverse. The path forward is hazy, but you must choose.",
        leftChoice: { text: "Reboot", effects: { Power: 5, Wealth: -5, People: 0, Knowledge: 0 } },
        rightChoice: { text: "Wait", effects: { Power: -5, Wealth: 5, People: 0, Knowledge: 0 } },
    }]
};
