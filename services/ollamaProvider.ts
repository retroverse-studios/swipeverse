import { Deck } from "../types";
import { AIProvider, parseDeckFromResponse } from "./aiProvider";

export class OllamaProvider implements AIProvider {
    readonly name = "Ollama (Local)";
    readonly type = "ollama" as const;
    private baseUrl: string;
    private model: string;

    constructor(model: string = "llama3.1", baseUrl: string = "http://localhost:11434") {
        this.model = model;
        this.baseUrl = baseUrl;
    }

    async generateDeck(prompt: string, systemInstruction: string): Promise<Deck> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: systemInstruction + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation." },
                    { role: "user", content: prompt },
                ],
                stream: false,
                format: "json",
                options: { temperature: 1.0 },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama error (${response.status}): ${error}`);
        }

        const data = await response.json();
        const text = data.message?.content;
        if (!text) throw new Error("Empty response from Ollama");

        return parseDeckFromResponse(text);
    }
}
