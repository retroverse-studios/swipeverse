import React, { useState, useEffect } from 'react';
import { Reality, CardData, StatName, Deck, CARD_ARCHETYPES, CardArchetype } from '../types';
import { REALITIES, INITIAL_STATS, BUNDLED_ART_SETS, cardScenesFor, resolveAssetUrl } from '../constants';
import { BackIcon, SaveIcon, DeleteIcon, UploadIcon, ExportIcon, AddIcon, GenerateIcon, CloudUploadIcon, FormIcon, GraphIcon } from './icons';
import { generateBranchingDeckFromPrompt } from '../services/aiService';
import { analyzeDeck, DeckAnalysis } from '../services/deckSolver';
import { fetchStoreArtIndex, StoreArtIndex, STORE_ART_BASE } from '../services/apiService';
import { VisualEditor } from './VisualEditor';

interface EditorScreenProps {
    realities: Reality[];
    editingReality: Reality | null;
    onSetEditingReality: (reality: Reality | null) => void;
    onSave: (reality: Reality) => void;
    onDelete: (realityId: string) => void;
    onUpdateAll: (realities: Reality[]) => void;
    onClose: () => void;
    requestConfirmation: (options: { message: string, onConfirm: () => void }) => void;
    onSubmitToStore: (reality: Reality) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const createNewReality = (): Reality => ({
    id: `reality-${Date.now()}`,
    name: "New Reality",
    description: "A brand new world of possibilities.",
    font: 'font-exo',
    systemInstruction: "You are a creative storyteller for the interactive fiction game 'SwipeVerse'.",
    statNames: { Power: 'Stat A', Wealth: 'Stat B', People: 'Stat C', Knowledge: 'Stat D' },
    statIconNames: { Power: 'PowerIconCyber', Wealth: 'WealthIconCyber', People: 'PeopleIconCyber', Knowledge: 'KnowledgeIconCyber' },
    imageSet: [],
    colors: { primary: 'text-cyber-pink', secondary: 'text-cyber-cyan', background: 'bg-gray-900', accent: 'border-cyber-pink' },
    deck: { cards: [] },
    soundConfig: {},
});

const EditorScreen: React.FC<EditorScreenProps> = ({
    realities, editingReality, onSetEditingReality, onSave, onDelete, onUpdateAll, onClose, requestConfirmation, onSubmitToStore, addToast
}) => {
    const [formData, setFormData] = useState<Reality | null>(null);
    const [storyDirectorPrompt, setStoryDirectorPrompt] = useState('');
    const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
    const [sourceMaterial, setSourceMaterial] = useState('');
    const [deckAnalysis, setDeckAnalysis] = useState<DeckAnalysis | null>(null);
    const [storeArt, setStoreArt] = useState<StoreArtIndex | null>(null);
    const [storeArtSet, setStoreArtSet] = useState('');

    useEffect(() => {
        fetchStoreArtIndex().then(setStoreArt); // null when offline — palette hides
    }, []);
    const [isDirty, setIsDirty] = useState(false);
    const [editorView, setEditorView] = useState<'form' | 'visual'>('form');

    useEffect(() => {
        // Ensure formData always has a deck object
        if (editingReality) {
            const newFormData = JSON.parse(JSON.stringify(editingReality));
            if (!newFormData.deck) {
                newFormData.deck = { name: '', description: '', cards: [] };
            }
            if (!newFormData.soundConfig) {
                newFormData.soundConfig = {};
            }
            setFormData(newFormData);
        } else {
            setFormData(null);
        }
        setStoryDirectorPrompt('');
        setEditorView('form');
    }, [editingReality]);
    
    useEffect(() => {
        if (formData && editingReality) {
            setIsDirty(JSON.stringify(formData) !== JSON.stringify(editingReality));
        } else if (formData && !editingReality) {
            setIsDirty(true);
        } else {
            setIsDirty(false);
        }
    }, [formData, editingReality]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (!formData) return;
    
        const nameParts = name.split('.');
        if (nameParts.length === 2) {
            const field = nameParts[0] as keyof Reality;
            const subfield = nameParts[1];
            
            const parentField = formData[field];
            if (typeof parentField === 'object' && parentField !== null && !Array.isArray(parentField)) {
                setFormData({
                    ...formData,
                    [field]: {
                        ...(parentField as object),
                        [subfield]: value,
                    },
                });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const handleImageSetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!formData) return;
        const urls = e.target.value.split('\n').map(url => url.trim()).filter(Boolean);
        setFormData({...formData, imageSet: urls});
    };

    const handleSaveClick = () => {
        if (formData) {
            onSave(formData);
            addToast("Changes saved successfully!", 'success');
        }
    };
    
    const handleCreateClick = () => {
        const newReality = createNewReality();
        onSave(newReality);
        onSetEditingReality(newReality);
    };
    
    const handleAnalyzeDeck = () => {
        if (!formData?.deck || !formData.deck.cards || formData.deck.cards.length === 0) {
            addToast("No custom deck to analyze — add cards or generate a story first.", 'error');
            return;
        }
        setDeckAnalysis(analyzeDeck(formData.deck));
    };

    const handleDeckChange = (newDeck: Deck) => {
        setDeckAnalysis(null); // stale after any deck edit
        if (formData) {
            // Ensure deck has all properties
            const completeDeck: Deck = {
                name: newDeck.name || '',
                description: newDeck.description || '',
                cards: newDeck.cards || [],
            };
            setFormData({ ...formData, deck: completeDeck, deckUrl: undefined });
        }
    };

    const handleDeckFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (formData) {
            handleDeckChange({
                ...formData.deck!,
                [name]: value,
            });
        }
    };

    const handleCardsChange = (newCards: Omit<CardData, 'id'>[]) => {
        if (formData) {
            handleDeckChange({
                ...formData.deck!,
                cards: newCards,
            });
        }
    };
    
    const handleCardChange = (index: number, updatedCard: Omit<CardData, 'id'>) => {
        if (formData?.deck?.cards) {
            const newCards = [...formData.deck.cards];
            newCards[index] = updatedCard;
            handleCardsChange(newCards);
        }
    };

    const handleAddCard = () => {
        if (formData) {
            const newCard: Omit<CardData, 'id'> = {
                prompt: "New Scenario",
                imageUrl: "",
                leftChoice: { text: "Option A", effects: {Power:0, Wealth:0, People:0, Knowledge:0} },
                rightChoice: { text: "Option B", effects: {Power:0, Wealth:0, People:0, Knowledge:0} },
            };
            const newCards = [...(formData.deck?.cards || []), newCard];
            handleCardsChange(newCards);
        }
    };

    const handleDeleteCard = (index: number) => {
        if (formData?.deck?.cards) {
            const newCards = formData.deck.cards.filter((_, i) => i !== index);
            handleCardsChange(newCards);
        }
    };
    
    const handleExportDeck = () => {
        if (!formData?.deck) {
            addToast("No custom deck to export.", 'error');
            return;
        }
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(formData.deck, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `deck-${formData.id}.json`;
        link.click();
        link.remove();
    };

    const handleImportDeck = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !formData) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const deck = JSON.parse(e.target?.result as string);
                // Handle both old (array) and new (object) formats
                if(Array.isArray(deck)) {
                    handleDeckChange({ name: "Imported Deck", description: "", cards: deck });
                } else if (typeof deck === 'object' && deck !== null && 'cards' in deck) {
                    // A manual import is the player's own deck — drop any 'bundled' tag
                    // so app updates never overwrite it
                    delete deck.source;
                    handleDeckChange(deck);
                } else { throw new Error("Invalid format"); }
                addToast("Deck imported successfully!", 'success');
            } catch { addToast("Invalid deck file.", 'error'); }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleGenerateDeckClick = async () => {
        if (!formData || !storyDirectorPrompt) {
            addToast("Please enter a story prompt for the AI Director.", 'error');
            return;
        }
        requestConfirmation({
            message: "This will replace your current custom deck with a new, AI-generated one based on your prompt. This cannot be undone. Are you sure?",
            onConfirm: async () => {
                setIsGeneratingDeck(true);
                try {
                    const newDeck = await generateBranchingDeckFromPrompt(formData, storyDirectorPrompt, sourceMaterial);
                    handleDeckChange(newDeck);
                    setEditorView('visual'); // Switch to visual editor on success
                    addToast("AI deck generated successfully!", 'success');
                } catch (error) {
                    console.error("Failed to generate AI deck:", error);
                    addToast((error as Error).message, 'error');
                } finally {
                    setIsGeneratingDeck(false);
                }
            }
        });
    };

    const handleGlobalFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);
                if (Array.isArray(importedData) && importedData.length > 0) {
                    onUpdateAll(importedData);
                    onSetEditingReality(null);
                    addToast(`${importedData.length} realities imported successfully!`, 'success');
                } else {
                    addToast('Import failed: Invalid file format.', 'error');
                }
            } catch {
                addToast("Could not import realities. The file is not valid JSON.", 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleResetAll = () => {
        requestConfirmation({
            message: "Are you sure you want to reset all realities to their default settings? This cannot be undone.",
            onConfirm: () => {
                onUpdateAll(REALITIES);
                onSetEditingReality(null);
                addToast("All realities have been reset to default.", 'success');
            }
        });
    }

    const handleExportAll = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(realities, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "realities.json";
        link.click();
        link.remove();
    };

    const handleAttemptClose = () => {
        if (isDirty) {
            requestConfirmation({
                message: "You have unsaved changes. Are you sure you want to discard them and exit?",
                onConfirm: onClose,
            });
        } else {
            onClose();
        }
    };
    
    const handleAttemptSelectReality = (reality: Reality) => {
        if (isDirty) {
            requestConfirmation({
                message: "You have unsaved changes. Are you sure you want to discard them and switch realities?",
                onConfirm: () => onSetEditingReality(reality),
            });
        } else {
            onSetEditingReality(reality);
        }
    };
    
    const handleRevertToAi = () => {
        requestConfirmation({
            message: "This will remove the custom deck and revert to using the AI for scenarios. Are you sure?",
            onConfirm: () => handleDeckChange({name: '', description: '', cards:[]})
        });
    };

    const handleSubmitClick = () => {
        if (isDirty) {
            addToast("Please save your changes before submitting to the store.", 'error');
            return;
        }
        if (formData) {
            onSubmitToStore(formData);
        }
    };


    const CardEditor = ({ card, index }: { card: Omit<CardData, 'id'>, index: number }) => {
        const onCardChange = (field: string, value: unknown) => handleCardChange(index, {...card, [field]: value});
        const onChoiceChange = (choiceKey: 'leftChoice' | 'rightChoice', field: string, value: unknown) => {
            const updatedChoice = { ...card[choiceKey], [field]: value };
            if (field === 'nextCardIndex' && value === '') {
                delete updatedChoice.nextCardIndex; // Use default sequential if empty
            } else if (field === 'nextCardIndex') {
                updatedChoice.nextCardIndex = parseInt(String(value), 10);
            }
            onCardChange(choiceKey, updatedChoice);
        };
        const onEffectChange = (choiceKey: 'leftChoice' | 'rightChoice', stat: StatName, value: string) => {
            const newEffects = {
                ...card[choiceKey].effects,
                [stat]: Number(value) || 0,
            };
            onChoiceChange(choiceKey, 'effects', newEffects);
        };
        
        return (
            <div className="bg-slate-800/50 p-3 rounded-lg border border-gray-700 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className='flex-grow space-y-1'>
                        <textarea value={card.prompt} onChange={e => onCardChange('prompt', e.target.value)} className="w-full bg-gray-900 p-2 rounded text-sm" rows={2} placeholder="Scenario Prompt"></textarea>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400" title="Card archetype — selects the default art and helps the AI understand the card">Archetype</label>
                            <select
                                value={card.archetype || ''}
                                onChange={e => onCardChange('archetype', (e.target.value || undefined) as CardArchetype | undefined)}
                                className="bg-gray-900 p-1.5 rounded text-sm flex-grow"
                            >
                                <option value="">(none — random art)</option>
                                {CARD_ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-1.5 flex-wrap items-center pt-1">
                            <button
                                onClick={() => onCardChange('imageUrl', undefined)}
                                title="Auto: use the archetype's default art"
                                className={`h-12 w-16 rounded text-[10px] font-bold border-2 flex items-center justify-center ${!card.imageUrl ? 'border-cyber-pink text-cyber-pink bg-cyber-pink/10' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                AUTO
                            </button>
                            {cardScenesFor(formData?.id).map(scene => (
                                <button
                                    key={scene}
                                    onClick={() => onCardChange('imageUrl', scene)}
                                    title={scene}
                                    className={`h-12 w-16 rounded overflow-hidden border-2 ${card.imageUrl === scene ? 'border-cyber-pink' : 'border-transparent hover:border-gray-500'}`}
                                >
                                    <img src={resolveAssetUrl(scene)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <label className="text-xs text-gray-400 whitespace-nowrap">Art theme</label>
                            <select
                                value={storeArtSet}
                                onChange={e => setStoreArtSet(e.target.value)}
                                className="bg-gray-900 p-1.5 rounded text-sm flex-grow"
                            >
                                <option value="">(browse a theme…)</option>
                                <optgroup label="Built-in (works offline)">
                                    {BUNDLED_ART_SETS.map(s => <option key={s} value={`bundled:${s}`}>{s}</option>)}
                                </optgroup>
                                {storeArt && (
                                    <optgroup label="Store palette">
                                        {storeArt.sets.map(s => <option key={s} value={s}>{s}</option>)}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                        {storeArtSet && (
                            <div className="flex gap-1.5 flex-wrap items-center pt-1">
                                {CARD_ARCHETYPES.map(archetype => {
                                    const isBundled = storeArtSet.startsWith('bundled:');
                                    // Bundled sets store the canonical relative path (portable,
                                    // offline); store-palette sets store the absolute palette URL
                                    const url = isBundled
                                        ? `/cards/${storeArtSet.slice(8)}/${archetype}.webp`
                                        : `${STORE_ART_BASE}/${storeArtSet}/${archetype}.webp`;
                                    return (
                                        <button
                                            key={archetype}
                                            onClick={() => onCardChange('imageUrl', url)}
                                            title={`${storeArtSet.replace('bundled:', '')} · ${archetype}`}
                                            className={`h-12 w-16 rounded overflow-hidden border-2 ${card.imageUrl === url ? 'border-cyber-pink' : 'border-transparent hover:border-gray-500'}`}
                                        >
                                            <img src={resolveAssetUrl(url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <input
                            type="text"
                            value={card.imageUrl && !card.imageUrl.startsWith('/cards/') && !card.imageUrl.startsWith(STORE_ART_BASE) ? card.imageUrl : ''}
                            onChange={e => onCardChange('imageUrl', e.target.value || undefined)}
                            className="w-full bg-gray-900 p-2 rounded text-sm"
                            placeholder="Custom image URL (optional — store decks: bundled or palette art only)"
                        />
                    </div>
                    <button onClick={() => handleDeleteCard(index)} className="p-2 text-red-500 hover:text-red-400 text-xs self-start" title="Delete Card"><DeleteIcon /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['leftChoice', 'rightChoice'] as const).map(choiceKey => (
                       <div key={choiceKey} className="space-y-1 bg-black/20 p-2 rounded">
                            <input type="text" value={card[choiceKey].text} onChange={e => onChoiceChange(choiceKey, 'text', e.target.value)} className="w-full bg-gray-900 p-1 rounded font-bold" placeholder={`${choiceKey === 'leftChoice' ? 'Left' : 'Right'} Choice Text`} />
                             <input type="text" value={card[choiceKey].soundUrl || ''} onChange={e => onChoiceChange(choiceKey, 'soundUrl', e.target.value)} className="w-full bg-gray-900 p-1 rounded" placeholder="Optional Sound URL" />
                            <div className="grid grid-cols-2 gap-1">
                                {Object.keys(INITIAL_STATS).map(stat => (
                                    <div key={stat} className="flex items-center">
                                        <label className="mr-1 w-10 text-gray-400 text-xs truncate" title={stat}>{formData?.statNames[stat as StatName]}</label>
                                        <input type="number" value={card[choiceKey].effects[stat as StatName] || 0} onChange={e => onEffectChange(choiceKey, stat as StatName, e.target.value)} className="w-full bg-gray-800 p-1 rounded" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center pt-1">
                                <label className="mr-1 text-gray-400 text-xs" title="Next Card Index">Next Card #</label>
                                <input type="number" value={card[choiceKey].nextCardIndex ?? ''} onChange={e => onChoiceChange(choiceKey, 'nextCardIndex', e.target.value)} className="w-full bg-gray-800 p-1 rounded" placeholder={(index + 1).toString()} min="0" />
                            </div>
                       </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen animate-fade-in bg-gray-900 text-gray-200">
            {/* Sidebar */}
            <aside className="w-1/4 min-w-[300px] bg-gray-950/50 flex flex-col p-4 border-r border-gray-800">
                <div className="flex items-center mb-4">
                    <button onClick={handleAttemptClose} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
                    <h1 className="text-2xl font-bold ml-2 font-orbitron">Creator Hub</h1>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-1">
                    {realities.map(r => (
                        <div key={r.id} onClick={() => handleAttemptSelectReality(r)} className={`p-3 rounded-md cursor-pointer border-l-4 ${editingReality?.id === r.id ? 'bg-cyber-pink/20 border-cyber-pink' : 'border-transparent hover:bg-white/5'}`}>
                            <p className="font-bold truncate">{r.name}</p>
                            <p className="text-xs text-gray-400 truncate">{r.id}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-auto space-y-2 pt-4 border-t border-gray-800">
                   <button onClick={handleCreateClick} className="w-full flex items-center justify-center gap-2 py-2 px-4 font-bold rounded-md bg-cyber-pink/80 text-white hover:bg-cyber-pink">
                       <AddIcon /> Create New Reality
                   </button>
                   <div className="grid grid-cols-3 gap-2 text-sm">
                       <label htmlFor="import-all" className="text-center py-2 px-1 font-bold rounded-md bg-white/10 hover:bg-white/20 cursor-pointer">Import</label>
                       <input type="file" id="import-all" accept=".json" className="hidden" onChange={handleGlobalFileChange} />
                       <button onClick={handleExportAll} className="py-2 px-1 font-bold rounded-md bg-white/10 hover:bg-white/20">Export</button>
                       <button onClick={handleResetAll} className="py-2 px-1 font-bold rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/40">Reset</button>
                   </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-6 overflow-y-auto flex flex-col">
                {!formData ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-2xl text-gray-500">Select a reality to begin editing, or create a new one.</p>
                    </div>
                ) : (
                <div className="max-w-7xl mx-auto space-y-4 flex-grow flex flex-col w-full">
                    <div className="flex justify-between items-center">
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="text-4xl font-bold bg-transparent border-b-2 border-transparent focus:border-cyber-pink outline-none" />
                        <div className="flex items-center gap-2">
                           <button onClick={() => onDelete(formData.id)} className="p-3 rounded-md text-red-400 border-2 border-red-400/50 bg-transparent hover:bg-red-400/10" title="Delete Reality"><DeleteIcon /></button>
                           <button 
                             onClick={handleSubmitClick}
                             disabled={isDirty}
                             className={`flex items-center gap-2 py-2 px-4 font-bold rounded-md transition-all duration-300 ${!isDirty ? 'bg-mystic-purple/80 text-white hover:bg-mystic-purple' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                             title={isDirty ? "Save changes before submitting" : "Submit to Community Store"}
                           >
                            <CloudUploadIcon /> Submit
                           </button>
                           <button 
                             onClick={handleSaveClick}
                             disabled={!isDirty}
                             className={`flex items-center gap-2 py-2 px-4 font-bold rounded-md transition-all duration-300 ${isDirty ? 'bg-cyber-pink/80 text-white hover:bg-cyber-pink animate-pulse-fast' : 'bg-gray-700 text-gray-400'}`}
                           >
                            <SaveIcon /> {isDirty ? 'Save Changes' : 'Saved'}
                           </button>
                        </div>
                    </div>
                    
                    {/* Main Reality Details */}
                    <details className="bg-slate-800/50 p-4 rounded-lg" open>
                        <summary className="text-xl font-bold cursor-pointer">Reality Configuration</summary>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                            <div>
                                <label className='text-sm text-gray-400'>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full bg-gray-900 p-2 rounded" rows={3}></textarea>
                            </div>
                            <div>
                                <label className='text-sm text-gray-400'>System Instruction (for AI)</label>
                                <textarea name="systemInstruction" value={formData.systemInstruction} onChange={handleInputChange} className="w-full bg-gray-900 p-2 rounded" rows={3}></textarea>
                            </div>
                            <div>
                                <label className='text-sm text-gray-400'>Image Set (one URL per line)</label>
                                <textarea value={formData.imageSet?.join('\n') || ''} onChange={handleImageSetChange} className="w-full bg-gray-900 p-2 rounded" rows={3}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {Object.keys(formData.statNames).map(key => (
                                    <div key={key}>
                                        <label className='text-sm text-gray-400'>{key} Stat Name</label>
                                        <input type="text" name={`statNames.${key}`} value={formData.statNames[key as StatName]} onChange={handleInputChange} className="w-full bg-gray-900 p-2 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </details>
                    
                    {/* Sound Config */}
                     <details className="bg-slate-800/50 p-4 rounded-lg">
                        <summary className="text-xl font-bold cursor-pointer">Sound Configuration</summary>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                            {(['backgroundMusicUrl', 'gameStartUrl', 'gameWinUrl', 'gameLoseUrl', 'swipeLeftUrl', 'swipeRightUrl'] as const).map(key => (
                                <div key={key}>
                                    <label className='block text-gray-400 capitalize'>{key.replace('Url', '').replace(/([A-Z])/g, ' $1')}</label>
                                    <input type="text" name={`soundConfig.${key}`} value={formData.soundConfig?.[key] || ''} onChange={handleInputChange} className="w-full bg-gray-900 p-2 rounded" placeholder="Optional Sound URL" />
                                </div>
                            ))}
                        </div>
                    </details>
                    
                    {/* Deck Editor */}
                    <section className="bg-slate-800/50 p-4 rounded-lg flex-grow flex flex-col">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                            <h3 className="text-xl font-bold">Deck Editor</h3>
                             <div className="flex items-center gap-2">
                                <div className="flex items-center bg-gray-900/50 border border-gray-700 rounded-md p-1">
                                    <button onClick={() => setEditorView('form')} className={`p-1 rounded-md ${editorView === 'form' ? 'bg-cyber-pink text-white' : 'text-gray-400 hover:bg-white/10'}`} title="Form View"><FormIcon /></button>
                                    <button onClick={() => setEditorView('visual')} className={`p-1 rounded-md ${editorView === 'visual' ? 'bg-cyber-pink text-white' : 'text-gray-400 hover:bg-white/10'}`} title="Visual Power Editor"><GraphIcon /></button>
                                </div>
                                <label htmlFor={`deck-import-${formData.id}`} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-white/10 hover:bg-white/20 cursor-pointer">
                                    <UploadIcon /> Import
                                </label>
                                <input type="file" id={`deck-import-${formData.id}`} accept=".json" className="hidden" onChange={handleImportDeck} disabled={isGeneratingDeck}/>
                                <button onClick={handleExportDeck} disabled={isGeneratingDeck} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50">
                                    <ExportIcon /> Export
                                </button>
                                <button onClick={handleAnalyzeDeck} disabled={isGeneratingDeck} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 disabled:opacity-50" title="Check the deck is winnable and losable at every difficulty">
                                    ⚖ Analyze
                                </button>
                                <button onClick={handleRevertToAi} disabled={isGeneratingDeck} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-red-500/20 text-red-400 hover:bg-red-500/40 disabled:opacity-50">
                                    <DeleteIcon/> Revert to AI
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <input type="text" name="name" value={formData.deck?.name || ''} onChange={handleDeckFieldChange} placeholder="Deck Title" className="w-full bg-gray-900 p-2 rounded text-lg font-bold" />
                            <textarea name="description" value={formData.deck?.description || ''} onChange={handleDeckFieldChange} placeholder="Deck Description..." className="w-full bg-gray-900 p-2 rounded text-sm" rows={2}></textarea>
                        </div>

                        {deckAnalysis && (
                            <div className="mb-4 bg-slate-900/70 border border-cyan-500/30 rounded-lg p-4 text-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-cyan-300">⚖ Deck Analysis</h4>
                                    <button onClick={() => setDeckAnalysis(null)} className="text-gray-500 hover:text-white text-xs">dismiss</button>
                                </div>
                                <table className="w-full text-left mb-3">
                                    <thead>
                                        <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="pb-1">Difficulty</th><th>Winnable</th><th>Losable</th><th>Random-play survival</th><th>Example winning line</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deckAnalysis.perDifficulty.map(d => (
                                            <tr key={d.difficulty} className="border-t border-gray-800">
                                                <td className="py-1 capitalize">{d.difficulty}</td>
                                                <td className={d.winnable === 'yes' ? 'text-green-400' : 'text-red-400 font-bold'}>{d.winnable}</td>
                                                <td className={d.losable === 'yes' ? 'text-green-400' : 'text-yellow-400 font-bold'}>{d.losable}</td>
                                                <td>{(d.survival * 100).toFixed(1)}%</td>
                                                <td className="text-gray-400 max-w-[180px] truncate" title={d.winningLine?.map(s => s === 'leftChoice' ? '⇦' : '⇨').join('')}>
                                                    {d.winningLine ? `${d.winningLine.map(s => s === 'leftChoice' ? '⇦' : '⇨').join('')} (${d.winningLine.length})` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <ul className="space-y-1 text-gray-300 list-disc pl-5">
                                    {deckAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}


                        {editorView === 'form' && (
                            <div className='flex-grow flex flex-col'>
                            <div className="bg-slate-900/70 p-4 rounded-lg border border-purple-500/30">
                                <h4 className="text-lg font-bold text-purple-300 flex items-center gap-2"><GenerateIcon/> AI Story Director</h4>
                                <p className="text-sm text-gray-400 mt-1 mb-2">Describe a high-level story. The AI will generate a full, complex deck. Best viewed in the Visual Editor.</p>
                                <textarea
                                    value={storyDirectorPrompt}
                                    onChange={(e) => setStoryDirectorPrompt(e.target.value)}
                                    className="w-full bg-gray-900 p-2 rounded text-sm"
                                    rows={3}
                                    placeholder="e.g., A detective story where the player must find a killer. One path involves trusting a shady informant, leading to a trap..."
                                ></textarea>
                                <details className="mt-2">
                                    <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                        Source material (optional) — ground the deck in a short story, lecture notes, a workshop, a case study…
                                    </summary>
                                    <textarea
                                        value={sourceMaterial}
                                        onChange={(e) => setSourceMaterial(e.target.value)}
                                        className="w-full bg-gray-900 p-2 rounded text-sm mt-2"
                                        rows={8}
                                        placeholder="Paste the material here. The AI draws scenarios, terminology and stakes from it — for educational material it turns key concepts and trade-offs into judgment dilemmas (never recall quizzes). A few pages works best."
                                    ></textarea>
                                </details>
                                <button 
                                    onClick={handleGenerateDeckClick} 
                                    disabled={isGeneratingDeck || !storyDirectorPrompt}
                                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 font-bold rounded-md bg-purple-500/80 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isGeneratingDeck ? 'Generating Story...' : 'Generate & View Story Graph'}
                                </button>
                            </div>
                            
                            <div className="mt-4 flex-grow overflow-y-auto">
                            {(!formData.deck?.cards || formData.deck.cards.length === 0) ? (
                                <p className="text-center text-gray-400 py-4">This reality uses AI to generate scenarios. Use the Story Director, import a deck, or add a card to begin.</p>
                            ) : (
                                <div className="space-y-3 pr-2">
                                    {formData.deck.cards.map((card, index) => <CardEditor key={index} card={card} index={index} />)}
                                </div>
                            )}
                            </div>
                            <button onClick={handleAddCard} className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 font-bold rounded-md bg-white/10 hover:bg-white/20"><AddIcon /> Add Card</button>
                            </div>
                        )}
                        
                        {editorView === 'visual' && (
                            <div className="mt-4 flex-grow bg-gray-950/50 rounded-lg border border-gray-700">
                                <VisualEditor cards={formData.deck?.cards || []} onCardsChange={handleCardsChange} />
                            </div>
                        )}

                    </section>
                </div>
                )}
            </main>
        </div>
    );
};

export default EditorScreen;