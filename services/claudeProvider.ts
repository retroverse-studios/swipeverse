import { Deck } from "../types";
import { AIProvider, parseDeckFromResponse } from "./aiProvider";

export class ClaudeProvider implements AIProvider {
    readonly name = "Anthropic Claude";
    readonly type = "claude" as const;
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = "claude-sonnet-4-6") {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateDeck(prompt: string, systemInstruction: string): Promise<Deck> {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 8192,
                system: systemInstruction + "\n\nYou MUST respond with valid JSON only. No markdown code blocks, no explanation, just the JSON object.",
                messages: [
                    { role: "user", content: prompt },
                ],
                temperature: 1.0,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error (${response.status}): ${error}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text;
        if (!text) throw new Error("Empty response from Claude");

        return parseDeckFromResponse(text);
    }
}
