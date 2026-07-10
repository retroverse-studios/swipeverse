import { Deck } from "../types";
import { AIProvider, AIProviderType, parseDeckFromResponse } from "./aiProvider";

/**
 * OpenAI chat-completions provider. Also powers every OpenAI-compatible
 * service (OpenRouter, Grok/xAI, LM Studio, Groq, Together, ...) via the
 * baseUrl + display name/type overrides.
 */
export class OpenAIProvider implements AIProvider {
    readonly name: string;
    readonly type: AIProviderType;
    private apiKey: string;
    private model: string;
    private baseUrl: string;

    constructor(
        apiKey: string,
        model: string = "gpt-4o-mini",
        baseUrl: string = "https://api.openai.com/v1",
        name: string = "OpenAI",
        type: AIProviderType = "openai",
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.name = name;
        this.type = type;
    }

    async generateDeck(prompt: string, systemInstruction: string): Promise<Deck> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: systemInstruction + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation." },
                    { role: "user", content: prompt },
                ],
                temperature: 1.0,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${error}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error("Empty response from OpenAI");

        return parseDeckFromResponse(text);
    }
}
