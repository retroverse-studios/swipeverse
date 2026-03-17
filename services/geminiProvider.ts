import { GoogleGenAI, Type } from "@google/genai";
import { Deck } from "../types";
import { AIProvider } from "./aiProvider";

const choiceSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING, description: "Text for the choice. Keep it brief." },
        effects: {
            type: Type.OBJECT,
            properties: {
                Power: { type: Type.NUMBER },
                Wealth: { type: Type.NUMBER },
                People: { type: Type.NUMBER },
                Knowledge: { type: Type.NUMBER }
            },
            required: ["Power", "Wealth", "People", "Knowledge"]
        },
        nextCardIndex: { type: Type.NUMBER, description: "Optional 0-based index of the card to jump to." },
        soundUrl: { type: Type.STRING, description: "Optional sound effect URL." }
    },
    required: ["text", "effects"]
};

const cardSchema = {
    type: Type.OBJECT,
    properties: {
        prompt: { type: Type.STRING, description: "The scenario text." },
        imageUrl: { type: Type.STRING, description: "Optional image URL." },
        leftChoice: choiceSchema,
        rightChoice: choiceSchema
    },
    required: ["prompt", "leftChoice", "rightChoice"]
};

const deckSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        cards: { type: Type.ARRAY, items: cardSchema }
    },
    required: ["name", "description", "cards"]
};

export class GeminiProvider implements AIProvider {
    readonly name = "Google Gemini";
    readonly type = "gemini" as const;
    private ai: GoogleGenAI;
    private model: string;

    constructor(apiKey: string, model: string = "gemini-2.5-flash") {
        this.ai = new GoogleGenAI({ apiKey });
        this.model = model;
    }

    async generateDeck(prompt: string, systemInstruction: string): Promise<Deck> {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: deckSchema,
                temperature: 1.0,
            },
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini");
        return JSON.parse(text) as Deck;
    }
}
