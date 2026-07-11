import React, { useState } from 'react';
import { AISettings, AIProviderType, loadAISettings, saveAISettings } from '../services/aiService';
import { SHELL_THEMES } from '../services/shellTheme';
import { useShellTheme } from './ShellThemeContext';
import { CloseIcon } from './icons';

interface AISettingsModalProps {
    onClose: () => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

type SettingsField = {
    key: keyof AISettings;
    label: string;
    type: 'password' | 'text';
    placeholder?: string;
    hint?: string;
};

const PROVIDERS: { value: AIProviderType; label: string; blurb: string; fields: SettingsField[] }[] = [
    {
        value: 'gemini', label: 'Google Gemini',
        blurb: 'Native JSON output, free tier available — get a key at ai.google.dev',
        fields: [
            { key: 'geminiApiKey', label: 'API Key', type: 'password', placeholder: 'Your Gemini API key' },
            { key: 'geminiModel', label: 'Model', type: 'text' },
        ],
    },
    {
        value: 'openai', label: 'OpenAI',
        blurb: 'GPT models — get a key at platform.openai.com',
        fields: [
            { key: 'openaiApiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
            { key: 'openaiModel', label: 'Model', type: 'text' },
        ],
    },
    {
        value: 'claude', label: 'Anthropic Claude',
        blurb: 'Claude models — get a key at console.anthropic.com',
        fields: [
            { key: 'claudeApiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
            { key: 'claudeModel', label: 'Model', type: 'text' },
        ],
    },
    {
        value: 'openrouter', label: 'OpenRouter',
        blurb: 'One key, hundreds of models — get a key at openrouter.ai/keys',
        fields: [
            { key: 'openrouterApiKey', label: 'API Key', type: 'password', placeholder: 'sk-or-...' },
            { key: 'openrouterModel', label: 'Model', type: 'text', hint: 'e.g. openai/gpt-4o-mini, anthropic/claude-sonnet-4.5' },
        ],
    },
    {
        value: 'grok', label: 'Grok (xAI)',
        blurb: 'xAI models — get a key at console.x.ai',
        fields: [
            { key: 'grokApiKey', label: 'API Key', type: 'password', placeholder: 'xai-...' },
            { key: 'grokModel', label: 'Model', type: 'text', hint: 'e.g. grok-3-mini, grok-3' },
        ],
    },
    {
        value: 'compatible', label: 'OpenAI-Compatible',
        blurb: 'Any service speaking the OpenAI chat API: LM Studio, Groq, Together, Azure, Mistral...',
        fields: [
            { key: 'compatBaseUrl', label: 'Base URL', type: 'text', placeholder: 'http://localhost:1234/v1' },
            { key: 'compatApiKey', label: 'API Key (if required)', type: 'password', placeholder: 'optional' },
            { key: 'compatModel', label: 'Model', type: 'text', placeholder: 'model name as the service expects it' },
        ],
    },
    {
        value: 'ollama', label: 'Ollama',
        blurb: 'Free, runs on your machine — no key needed for localhost',
        fields: [
            { key: 'ollamaBaseUrl', label: 'Base URL', type: 'text' },
            { key: 'ollamaModel', label: 'Model', type: 'text', hint: 'e.g. llama3.1, mistral, gemma2' },
            { key: 'ollamaApiKey', label: 'Bearer Token (optional)', type: 'password', hint: 'Only for remote or proxied Ollama servers' },
        ],
    },
];

const AISettingsModal: React.FC<AISettingsModalProps> = ({ onClose, addToast }) => {
    const [settings, setSettings] = useState<AISettings>(loadAISettings);
    const [activeTab, setActiveTab] = useState<'game' | 'deck'>('game');
    const { shellTheme, setShellTheme } = useShellTheme();

    const handleChange = (field: keyof AISettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        saveAISettings(settings);
        addToast('Settings saved!', 'success');
        onClose();
    };

    const activeProvider = PROVIDERS.find(p => p.value === settings.provider) ?? PROVIDERS[0];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-tarot-velvet-2 border border-tarot-gold/30 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between p-4 pb-0">
                    <h2 className="text-xl font-bold font-cinzel text-tarot-gold-bright">Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><CloseIcon /></button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-4 mt-3 border-b border-gray-800">
                    {([['game', 'Game'], ['deck', 'Deck Building']] as const).map(([tab, label]) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-4 text-sm font-bold rounded-t-md transition-colors ${
                                activeTab === tab
                                    ? 'bg-white/5 text-tarot-gold-bright border border-tarot-gold/30 border-b-transparent'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-4 space-y-4 flex-grow">
                    {activeTab === 'game' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Game Shell</label>
                            <div className="grid grid-cols-3 gap-2">
                                {SHELL_THEMES.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setShellTheme(theme.id)}
                                        title={theme.description}
                                        className={`p-2.5 rounded-lg border text-sm font-bold transition-colors ${
                                            shellTheme === theme.id
                                                ? 'border-tarot-gold bg-tarot-gold/10 text-white'
                                                : 'border-gray-700 text-gray-400 hover:border-gray-500'
                                        }`}
                                    >
                                        {theme.name}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Changes the look of the menu and game screens. Applies instantly.</p>
                        </div>
                    )}

                    {activeTab === 'deck' && (
                        <>
                            <p className="text-xs text-gray-400 bg-black/30 border border-tarot-gold/20 rounded-md p-2.5 leading-relaxed">
                                An AI provider is <span className="text-white font-semibold">only used to generate new stories</span> — fresh decks
                                when you start a game, and the editor's Story Director. The built-in and downloaded stories play without any of this.
                            </p>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Provider</label>
                                <select
                                    value={settings.provider}
                                    onChange={e => handleChange('provider', e.target.value)}
                                    className="w-full bg-black/40 p-2.5 rounded text-sm border border-tarot-gold/20"
                                >
                                    {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">{activeProvider.blurb}</p>
                            </div>

                            <div className="space-y-3 pt-1">
                                {activeProvider.fields.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={settings[field.key] as string}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm"
                                            placeholder={field.placeholder}
                                        />
                                        {field.hint && <p className="text-xs text-gray-500 mt-1">{field.hint}</p>}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
                    <button onClick={onClose} className="py-2 px-4 text-sm rounded-md text-gray-400 hover:bg-white/10">Cancel</button>
                    <button onClick={handleSave} className="py-2 px-4 text-sm font-bold rounded-md bg-tarot-gold text-[#241503] hover:bg-tarot-gold-bright">Save Settings</button>
                </div>
            </div>
        </div>
    );
};

export default AISettingsModal;
