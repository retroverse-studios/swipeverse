/**
 * SwipeVerse AI Service
 *
 * Delegates deck generation to the configured AI provider.
 * Provider selection and API keys are managed via localStorage settings.
 */

import { Reality, Stats, Deck } from "../types";
import { AIProvider, buildInitialDeckPrompt, buildBranchingDeckPrompt, validateAndRepairDeck } from "./aiProvider";
import type { AIProviderType } from "./aiProvider";
export type { AIProviderType } from "./aiProvider";
import { GeminiProvider } from "./geminiProvider";
import { OpenAIProvider } from "./openaiProvider";
import { ClaudeProvider } from "./claudeProvider";
import { OllamaProvider } from "./ollamaProvider";

// ─── Settings Persistence ────────────────────────────────────────

const SETTINGS_KEY = 'swipeverse-ai-settings';

export interface AISettings {
    provider: AIProviderType;
    geminiApiKey: string;
    geminiModel: string;
    openaiApiKey: string;
    openaiModel: string;
    openaiBaseUrl: string;
    claudeApiKey: string;
    claudeModel: string;
    openrouterApiKey: string;
    openrouterModel: string;
    grokApiKey: string;
    grokModel: string;
    compatApiKey: string;
    compatModel: string;
    compatBaseUrl: string;
    ollamaModel: string;
    ollamaBaseUrl: string;
    ollamaApiKey: string;
}

const DEFAULT_SETTINGS: AISettings = {
    provider: 'gemini',
    geminiApiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '',
    geminiModel: 'gemini-2.5-flash',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: 'gpt-4o-mini',
    openaiBaseUrl: 'https://api.openai.com/v1',
    claudeApiKey: process.env.ANTHROPIC_API_KEY || '',
    claudeModel: 'claude-sonnet-5',
    openrouterApiKey: '',
    openrouterModel: 'openai/gpt-4o-mini',
    grokApiKey: '',
    grokModel: 'grok-3-mini',
    compatApiKey: '',
    compatModel: '',
    compatBaseUrl: '',
    ollamaModel: 'llama3.1',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaApiKey: '',
};

export function loadAISettings(): AISettings {
    try {
        const stored = window.localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch { /* use defaults */ }

    return { ...DEFAULT_SETTINGS };
}

export function saveAISettings(settings: AISettings): void {
    try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save AI settings:", error);
    }
}

// ─── Provider Factory ────────────────────────────────────────────

function createProvider(settings: AISettings): AIProvider {
    switch (settings.provider) {
        case 'gemini':
            if (!settings.geminiApiKey) throw new Error("Gemini API key not configured. Go to Settings to add one.");
            return new GeminiProvider(settings.geminiApiKey, settings.geminiModel);

        case 'openai':
            if (!settings.openaiApiKey) throw new Error("OpenAI API key not configured. Go to Settings to add one.");
            return new OpenAIProvider(settings.openaiApiKey, settings.openaiModel, settings.openaiBaseUrl);

        case 'claude':
            if (!settings.claudeApiKey) throw new Error("Claude API key not configured. Go to Settings to add one.");
            return new ClaudeProvider(settings.claudeApiKey, settings.claudeModel);

        case 'openrouter':
            if (!settings.openrouterApiKey) throw new Error("OpenRouter API key not configured. Go to Settings to add one.");
            return new OpenAIProvider(settings.openrouterApiKey, settings.openrouterModel, 'https://openrouter.ai/api/v1', 'OpenRouter', 'openrouter');

        case 'grok':
            if (!settings.grokApiKey) throw new Error("Grok (xAI) API key not configured. Go to Settings to add one.");
            return new OpenAIProvider(settings.grokApiKey, settings.grokModel, 'https://api.x.ai/v1', 'Grok (xAI)', 'grok');

        case 'compatible':
            if (!settings.compatBaseUrl) throw new Error("Base URL not configured for the OpenAI-compatible provider. Go to Settings to add one.");
            if (!settings.compatModel) throw new Error("Model not configured for the OpenAI-compatible provider. Go to Settings to add one.");
            return new OpenAIProvider(settings.compatApiKey, settings.compatModel, settings.compatBaseUrl, 'OpenAI-Compatible', 'compatible');

        case 'ollama':
            return new OllamaProvider(settings.ollamaModel, settings.ollamaBaseUrl, settings.ollamaApiKey || undefined);

        default:
            throw new Error(`Unknown AI provider: ${settings.provider}`);
    }
}

// ─── Public API (same interface as before) ───────────────────────

/** True when the selected provider is usable (has a key, or is keyless like Ollama). */
export function hasConfiguredProvider(): boolean {
    const settings = loadAISettings();
    switch (settings.provider) {
        case 'gemini': return !!settings.geminiApiKey;
        case 'openai': return !!settings.openaiApiKey;
        case 'claude': return !!settings.claudeApiKey;
        case 'openrouter': return !!settings.openrouterApiKey;
        case 'grok': return !!settings.grokApiKey;
        case 'compatible': return !!settings.compatBaseUrl && !!settings.compatModel;
        case 'ollama': return true;
        default: return false;
    }
}

/** Display name of the currently configured provider, for loading/error UI. */
export function getActiveProviderLabel(): string {
    switch (loadAISettings().provider) {
        case 'gemini': return 'Google Gemini';
        case 'openai': return 'OpenAI';
        case 'claude': return 'Anthropic Claude';
        case 'openrouter': return 'OpenRouter';
        case 'grok': return 'Grok (xAI)';
        case 'compatible': return 'your OpenAI-compatible provider';
        case 'ollama': return 'Ollama (local)';
        default: return 'AI';
    }
}

export const generateInitialDeck = async (reality: Reality, currentStats: Stats): Promise<Deck> => {
    const settings = loadAISettings();
    const provider = createProvider(settings);
    const prompt = buildInitialDeckPrompt(reality, currentStats);

    try {
        const deck = await provider.generateDeck(prompt, reality.systemInstruction);
        return validateAndRepairDeck(deck);
    } catch (error) {
        console.error("Error generating deck:", error);
        throw new Error(`${provider.name} failed to generate a deck. ${(error as Error).message}`);
    }
};

export const generateBranchingDeckFromPrompt = async (reality: Reality, storyPrompt: string, sourceMaterial?: string): Promise<Deck> => {
    const settings = loadAISettings();
    const provider = createProvider(settings);
    const prompt = buildBranchingDeckPrompt(reality, storyPrompt, sourceMaterial);

    try {
        const deck = await provider.generateDeck(prompt, reality.systemInstruction);
        return validateAndRepairDeck(deck);
    } catch (error) {
        console.error("Error generating branching deck:", error);
        throw new Error(`The AI Story Director (${provider.name}) failed to generate a deck. ${(error as Error).message}`);
    }
};
