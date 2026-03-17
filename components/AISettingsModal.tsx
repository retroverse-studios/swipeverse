import React, { useState } from 'react';
import { AISettings, AIProviderType, loadAISettings, saveAISettings } from '../services/geminiService';
import { CloseIcon } from './icons';

interface AISettingsModalProps {
    onClose: () => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const PROVIDER_OPTIONS: { value: AIProviderType; label: string; description: string }[] = [
    { value: 'gemini', label: 'Google Gemini', description: 'Best structured output. Requires API key from ai.google.dev' },
    { value: 'openai', label: 'OpenAI', description: 'GPT-4o-mini or any OpenAI-compatible API' },
    { value: 'claude', label: 'Anthropic Claude', description: 'Claude models. Requires API key from console.anthropic.com' },
    { value: 'ollama', label: 'Ollama (Local)', description: 'Free, runs locally. Requires Ollama running on your machine' },
];

const AISettingsModal: React.FC<AISettingsModalProps> = ({ onClose, addToast }) => {
    const [settings, setSettings] = useState<AISettings>(loadAISettings);

    const handleChange = (field: keyof AISettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        saveAISettings(settings);
        addToast('AI settings saved!', 'success');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold font-orbitron">AI Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><CloseIcon /></button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">AI Provider</label>
                        <div className="space-y-2">
                            {PROVIDER_OPTIONS.map(opt => (
                                <label key={opt.value}
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        settings.provider === opt.value
                                            ? 'border-cyber-pink bg-cyber-pink/10'
                                            : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="provider"
                                        value={opt.value}
                                        checked={settings.provider === opt.value}
                                        onChange={() => handleChange('provider', opt.value)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <span className="font-bold text-white">{opt.label}</span>
                                        <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Provider-specific settings */}
                    {settings.provider === 'gemini' && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                                <input type="password" value={settings.geminiApiKey} onChange={e => handleChange('geminiApiKey', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" placeholder="Your Gemini API key" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Model</label>
                                <input type="text" value={settings.geminiModel} onChange={e => handleChange('geminiModel', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" />
                            </div>
                        </div>
                    )}

                    {settings.provider === 'openai' && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                                <input type="password" value={settings.openaiApiKey} onChange={e => handleChange('openaiApiKey', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" placeholder="sk-..." />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Model</label>
                                <input type="text" value={settings.openaiModel} onChange={e => handleChange('openaiModel', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Base URL</label>
                                <input type="text" value={settings.openaiBaseUrl} onChange={e => handleChange('openaiBaseUrl', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" placeholder="https://api.openai.com/v1" />
                                <p className="text-xs text-gray-500 mt-1">Change for OpenAI-compatible APIs (Azure, Groq, Together, etc.)</p>
                            </div>
                        </div>
                    )}

                    {settings.provider === 'claude' && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                                <input type="password" value={settings.claudeApiKey} onChange={e => handleChange('claudeApiKey', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" placeholder="sk-ant-..." />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Model</label>
                                <input type="text" value={settings.claudeModel} onChange={e => handleChange('claudeModel', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" />
                            </div>
                        </div>
                    )}

                    {settings.provider === 'ollama' && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Model</label>
                                <input type="text" value={settings.ollamaModel} onChange={e => handleChange('ollamaModel', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" />
                                <p className="text-xs text-gray-500 mt-1">e.g. llama3.1, mistral, gemma2</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Base URL</label>
                                <input type="text" value={settings.ollamaBaseUrl} onChange={e => handleChange('ollamaBaseUrl', e.target.value)}
                                    className="w-full bg-gray-800 p-2 rounded text-sm" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
                    <button onClick={onClose} className="py-2 px-4 text-sm rounded-md text-gray-400 hover:bg-white/10">Cancel</button>
                    <button onClick={handleSave} className="py-2 px-4 text-sm font-bold rounded-md bg-cyber-pink/80 text-white hover:bg-cyber-pink">Save Settings</button>
                </div>
            </div>
        </div>
    );
};

export default AISettingsModal;
