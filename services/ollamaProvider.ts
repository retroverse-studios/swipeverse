import { Deck } from "../types";
import { AIProvider, parseDeckFromResponse } from "./aiProvider";

export class OllamaProvider implements AIProvider {
    readonly name = "Ollama";
    readonly type = "ollama" as const;
    private baseUrl: string;
    private model: string;
    private apiKey?: string;

    constructor(model: string = "llama3.1", baseUrl: string = "http://localhost:11434", apiKey?: string) {
        this.model = model;
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
    }

    async generateDeck(prompt: string, systemInstruction: string): Promise<Deck> {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        // Optional bearer token for remote/proxied Ollama (e.g. behind a reverse proxy or Ollama cloud)
        if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers,
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
