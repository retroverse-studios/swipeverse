import React, { useState, useEffect } from 'react';
import { Reality, CardData, StatName, Deck, CARD_ARCHETYPES, CardArchetype } from '../types';
import { REALITIES, INITIAL_STATS, BUNDLED_ART_SETS, BUNDLED_ART_INFO, cardScenesFor, resolveAssetUrl } from '../constants';
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
    onAddDeckToLibrary: (deck: Deck) => void;
    onOpenAISettings: () => void;
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
    colors: { primary: 'text-cyber-pink', secondary: 'text-cyber-cyan', background: 'bg-velvet', accent: 'border-cyber-pink' },
    deck: { cards: [] },
    soundConfig: {},
});

const EditorScreen: React.FC<EditorScreenProps> = ({
    realities, editingReality, onSetEditingReality, onSave, onDelete, onUpdateAll, onClose, requestConfirmation, onSubmitToStore, onAddDeckToLibrary, onOpenAISettings, addToast
}) => {
    const [formData, setFormData] = useState<Reality | null>(null);
    const [storyDirectorPrompt, setStoryDirectorPrompt] = useState('');
    const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
    const [sourceMaterial, setSourceMaterial] = useState('');
    const [deckSize, setDeckSize] = useState(20);
    const [autoTheme, setAutoTheme] = useState(true);
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
    
    /**
     * Bulk art assignment. Random: one randomly-picked theme applied
     * coherently across the deck. Chaos: every card from a different random
     * theme. Both write imageUrl per card, so the result is fixed until
     * re-rolled or hand-edited.
     */
    const handleBulkArt = (chaos: boolean) => {
        if (!formData?.deck?.cards || formData.deck.cards.length === 0) {
            addToast("No cards to art — add cards or generate a story first.", 'error');
            return;
        }
        const sets: { set: string; store: boolean }[] = [
            ...BUNDLED_ART_SETS.map(s => ({ set: s as string, store: false })),
            ...(storeArt ? storeArt.sets.map(s => ({ set: s, store: true })) : []),
        ];
        const pick = () => sets[Math.floor(Math.random() * sets.length)];
        const urlFor = (entry: { set: string; store: boolean }, archetype: string) =>
            entry.store ? `${STORE_ART_BASE}/${entry.set}/${archetype}.webp` : `/cards/${entry.set}/${archetype}.webp`;
        const theOne = pick();
        const cards = formData.deck.cards.map(card => {
            const entry = chaos ? pick() : theOne;
            const archetype = card.archetype ?? CARD_ARCHETYPES[Math.floor(Math.random() * CARD_ARCHETYPES.length)];
            return { ...card, imageUrl: urlFor(entry, archetype) };
        });
        handleCardsChange(cards);
        addToast(chaos
            ? `Chaos! Every card drew from a random theme${storeArt ? '' : ' (built-in sets only — store palette offline)'}.`
            : `Theme "${theOne.set}" applied to the whole deck.`);
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
            // Ensure deck has all properties (preserve optional metadata)
            const completeDeck: Deck = {
                name: newDeck.name || '',
                description: newDeck.description || '',
                ...(newDeck.category ? { category: newDeck.category } : {}),
                ...(newDeck.series ? { series: newDeck.series } : {}),
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

    /**
     * Best-matching art set for a story, scored by keyword overlap between the
     * story text and each set's name/title/genre hint. Prefix matching (min 4
     * shared chars) absorbs plurals ("detective" ~ "detectives"). Null when
     * nothing matches — the deck then keeps archetype-default art.
     */
    const STOP_WORDS = new Set(['the', 'and', 'with', 'for', 'from', 'that', 'this', 'where', 'must', 'their', 'your', 'into', 'about', 'story', 'stories', 'player', 'game', 'deck', 'cards', 'runs', 'young', 'discovers']);
    const matchArtSet = (text: string): { set: string; store: boolean; title: string } | null => {
        const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
        const storyWords = [...new Set(tokenize(text))];
        const matches = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
        const scoreOf = (set: string, info?: { title?: string; hint?: string }) => {
            const corpus = [...new Set(tokenize(`${set} ${info?.title ?? ''} ${info?.hint ?? ''}`))];
            return corpus.filter(c => storyWords.some(w => matches(c, w))).length;
        };
        let best: { set: string; store: boolean; title: string; score: number } | null = null;
        const consider = (set: string, store: boolean, info?: { title?: string; hint?: string }) => {
            const score = scoreOf(set, info);
            if (score > 0 && (!best || score > best.score)) best = { set, store, title: info?.title || set, score };
        };
        for (const s of BUNDLED_ART_SETS) consider(s, false, BUNDLED_ART_INFO[s]);
        for (const s of storeArt?.sets ?? []) consider(s, true, storeArt?.setInfo?.[s]);
        return best;
    };

    /** Bind every card's art to its archetype scene in the matched set. */
    const applyArtTheme = (deck: Deck, match: { set: string; store: boolean }): Deck => ({
        ...deck,
        cards: deck.cards.map(card => {
            const archetype = card.archetype ?? CARD_ARCHETYPES[Math.floor(Math.random() * CARD_ARCHETYPES.length)];
            const imageUrl = match.store
                ? `${STORE_ART_BASE}/${match.set}/${archetype}.webp`
                : `/cards/${match.set}/${archetype}.webp`;
            return { ...card, imageUrl };
        }),
    });

    const handleAddDeckToLibraryClick = () => {
        if (!formData?.deck?.cards?.length) {
            addToast("Add some cards before saving to your library.", 'error');
            return;
        }
        onAddDeckToLibrary({
            ...formData.deck,
            name: formData.deck.name || formData.name,
            description: formData.deck.description || formData.description,
        });
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
                    let newDeck = await generateBranchingDeckFromPrompt(formData, storyDirectorPrompt, sourceMaterial, deckSize);
                    let themed = '';
                    if (autoTheme) {
                        const match = matchArtSet(`${storyDirectorPrompt} ${newDeck.name ?? ''} ${newDeck.description ?? ''}`);
                        if (match) {
                            newDeck = applyArtTheme(newDeck, match);
                            themed = ` Art theme: ${match.title}.`;
                        }
                    }
                    handleDeckChange(newDeck);
                    setEditorView('visual'); // Switch to visual editor on success
                    addToast(`AI deck generated successfully!${themed}`, 'success');
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
            <div className="bg-tarot-velvet-2/70 p-3 rounded-lg border border-gray-700 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className='flex-grow space-y-1'>
                        <textarea value={card.prompt} onChange={e => onCardChange('prompt', e.target.value)} className="w-full bg-black/40 p-2 rounded text-sm" rows={2} placeholder="Scenario Prompt"></textarea>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400" title="Card archetype — selects the default art and helps the AI understand the card">Archetype</label>
                            <select
                                value={card.archetype || ''}
                                onChange={e => onCardChange('archetype', (e.target.value || undefined) as CardArchetype | undefined)}
                                className="bg-black/40 p-1.5 rounded text-sm flex-grow"
                            >
                                <option value="">(none — random art)</option>
                                {CARD_ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-1.5 flex-wrap items-center pt-1">
                            <button
                                onClick={() => onCardChange('imageUrl', undefined)}
                                title="Auto: use the archetype's default art"
                                className={`h-12 w-16 rounded text-[10px] font-bold border-2 flex items-center justify-center ${!card.imageUrl ? 'border-tarot-gold text-tarot-gold-bright bg-tarot-gold/10' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                AUTO
                            </button>
                            {cardScenesFor(formData?.id).map(scene => (
                                <button
                                    key={scene}
                                    onClick={() => onCardChange('imageUrl', scene)}
                                    title={scene}
                                    className={`h-12 w-16 rounded overflow-hidden border-2 ${card.imageUrl === scene ? 'border-tarot-gold' : 'border-transparent hover:border-gray-500'}`}
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
                                className="bg-black/40 p-1.5 rounded text-sm flex-grow"
                            >
                                <option value="">(browse a theme…)</option>
                                <optgroup label="Built-in (works offline)">
                                    {BUNDLED_ART_SETS.map(s => (
                                        <option key={s} value={`bundled:${s}`}>
                                            {BUNDLED_ART_INFO[s] ? `${BUNDLED_ART_INFO[s].title} — ${BUNDLED_ART_INFO[s].hint}` : s}
                                        </option>
                                    ))}
                                </optgroup>
                                {storeArt && (
                                    <optgroup label="Store palette">
                                        {storeArt.sets.map(s => {
                                            const info = storeArt.setInfo?.[s];
                                            return (
                                                <option key={s} value={s}>
                                                    {info?.title || s}{info?.hint ? ` — ${info.hint}` : ''}
                                                </option>
                                            );
                                        })}
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
                                            className={`h-12 w-16 rounded overflow-hidden border-2 ${card.imageUrl === url ? 'border-tarot-gold' : 'border-transparent hover:border-gray-500'}`}
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
                            className="w-full bg-black/40 p-2 rounded text-sm"
                            placeholder="Custom image URL (optional — store decks: bundled or palette art only)"
                        />
                    </div>
                    <button onClick={() => handleDeleteCard(index)} className="p-2 text-red-500 hover:text-red-400 text-xs self-start" title="Delete Card"><DeleteIcon /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['leftChoice', 'rightChoice'] as const).map(choiceKey => (
                       <div key={choiceKey} className="space-y-1 bg-black/20 p-2 rounded">
                            <input type="text" value={card[choiceKey].text} onChange={e => onChoiceChange(choiceKey, 'text', e.target.value)} className="w-full bg-black/40 p-1 rounded font-bold" placeholder={`${choiceKey === 'leftChoice' ? 'Left' : 'Right'} Choice Text`} />
                             <input type="text" value={card[choiceKey].soundUrl || ''} onChange={e => onChoiceChange(choiceKey, 'soundUrl', e.target.value)} className="w-full bg-black/40 p-1 rounded" placeholder="Optional Sound URL" />
                            <div className="grid grid-cols-2 gap-1">
                                {Object.keys(INITIAL_STATS).map(stat => (
                                    <div key={stat} className="flex items-center">
                                        <label className="mr-1 w-10 text-gray-400 text-xs truncate" title={stat}>{formData?.statNames[stat as StatName]}</label>
                                        <input type="number" value={card[choiceKey].effects[stat as StatName] || 0} onChange={e => onEffectChange(choiceKey, stat as StatName, e.target.value)} className="w-full bg-black/30 p-1 rounded" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center pt-1">
                                <label className="mr-1 text-gray-400 text-xs" title="Next Card Index">Next Card #</label>
                                <input type="number" value={card[choiceKey].nextCardIndex ?? ''} onChange={e => onChoiceChange(choiceKey, 'nextCardIndex', e.target.value)} className="w-full bg-black/30 p-1 rounded" placeholder={(index + 1).toString()} min="0" />
                            </div>
                       </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen animate-fade-in bg-velvet text-gray-200">
            {/* Sidebar */}
            <aside className="w-1/4 min-w-[300px] bg-black/40 flex flex-col p-4 border-r border-tarot-gold/20">
                <div className="flex items-center mb-4">
                    <button onClick={handleAttemptClose} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
                    <h1 className="text-2xl font-extrabold ml-2 font-cinzel text-gold-gradient">Creator Hub</h1>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-1">
                    {realities.map(r => (
                        <div key={r.id} onClick={() => handleAttemptSelectReality(r)} className={`p-3 rounded-md cursor-pointer border-l-4 ${editingReality?.id === r.id ? 'bg-tarot-gold/15 border-tarot-gold' : 'border-transparent hover:bg-white/5'}`}>
                            <p className="font-bold truncate">{r.name}</p>
                            <p className="text-xs text-gray-400 truncate">{r.id}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-auto space-y-2 pt-4 border-t border-gray-800">
                   <button onClick={handleCreateClick} className="w-full flex items-center justify-center gap-2 py-2 px-4 font-bold rounded-md bg-tarot-gold text-[#241503] hover:bg-tarot-gold-bright">
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
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="text-4xl font-bold bg-transparent border-b-2 border-transparent focus:border-tarot-gold outline-none" />
                        <div className="flex items-center gap-2">
                           <button onClick={() => onDelete(formData.id)} className="p-3 rounded-md text-red-400 border-2 border-red-400/50 bg-transparent hover:bg-red-400/10" title="Delete Reality"><DeleteIcon /></button>
                           <button 
                             onClick={handleSubmitClick}
                             disabled={isDirty}
                             className={`flex items-center gap-2 py-2 px-4 font-bold rounded-md transition-all duration-300 ${!isDirty ? 'bg-tarot-gold text-[#241503] hover:bg-tarot-gold-bright' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                             title={isDirty ? "Save changes before submitting" : "Submit to Community Store"}
                           >
                            <CloudUploadIcon /> Submit
                           </button>
                           <button 
                             onClick={handleSaveClick}
                             disabled={!isDirty}
                             className={`flex items-center gap-2 py-2 px-4 font-bold rounded-md transition-all duration-300 ${isDirty ? 'bg-tarot-gold text-[#241503] hover:bg-tarot-gold-bright animate-pulse-fast' : 'bg-gray-700 text-gray-400'}`}
                           >
                            <SaveIcon /> {isDirty ? 'Save Changes' : 'Saved'}
                           </button>
                        </div>
                    </div>
                    
                    {/* Main Reality Details */}
                    <details className="bg-tarot-velvet-2/70 p-4 rounded-lg" open>
                        <summary className="text-xl font-bold cursor-pointer">Reality Configuration</summary>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                            <div>
                                <label className='text-sm text-gray-400'>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full bg-black/40 p-2 rounded" rows={3}></textarea>
                            </div>
                            <div>
                                <label className='text-sm text-gray-400'>System Instruction (for AI)</label>
                                <textarea name="systemInstruction" value={formData.systemInstruction} onChange={handleInputChange} className="w-full bg-black/40 p-2 rounded" rows={3}></textarea>
                            </div>
                            <div>
                                <label className='text-sm text-gray-400'>Image Set (one URL per line)</label>
                                <textarea value={formData.imageSet?.join('\n') || ''} onChange={handleImageSetChange} className="w-full bg-black/40 p-2 rounded" rows={3}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {Object.keys(formData.statNames).map(key => (
                                    <div key={key}>
                                        <label className='text-sm text-gray-400'>{key} Stat Name</label>
                                        <input type="text" name={`statNames.${key}`} value={formData.statNames[key as StatName]} onChange={handleInputChange} className="w-full bg-black/40 p-2 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </details>
                    
                    {/* Sound Config */}
                     <details className="bg-tarot-velvet-2/70 p-4 rounded-lg">
                        <summary className="text-xl font-bold cursor-pointer">Sound Configuration</summary>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                            {(['backgroundMusicUrl', 'gameStartUrl', 'gameWinUrl', 'gameLoseUrl', 'swipeLeftUrl', 'swipeRightUrl'] as const).map(key => (
                                <div key={key}>
                                    <label className='block text-gray-400 capitalize'>{key.replace('Url', '').replace(/([A-Z])/g, ' $1')}</label>
                                    <input type="text" name={`soundConfig.${key}`} value={formData.soundConfig?.[key] || ''} onChange={handleInputChange} className="w-full bg-black/40 p-2 rounded" placeholder="Optional Sound URL" />
                                </div>
                            ))}
                        </div>
                    </details>
                    
                    {/* Deck Editor */}
                    <section className="bg-tarot-velvet-2/70 p-4 rounded-lg flex-grow flex flex-col">
                        <div className="flex justify-between items-center mb-3 border-b border-tarot-gold/20 pb-2">
                            <h3 className="text-xl font-bold">Deck Editor</h3>
                             <div className="flex items-center gap-2">
                                <div className="flex items-center bg-black/40 border border-tarot-gold/20 rounded-md p-1">
                                    <button onClick={() => setEditorView('form')} className={`p-1 rounded-md ${editorView === 'form' ? 'bg-tarot-gold text-[#241503]' : 'text-gray-400 hover:bg-white/10'}`} title="Form View"><FormIcon /></button>
                                    <button onClick={() => setEditorView('visual')} className={`p-1 rounded-md ${editorView === 'visual' ? 'bg-tarot-gold text-[#241503]' : 'text-gray-400 hover:bg-white/10'}`} title="Visual Power Editor"><GraphIcon /></button>
                                </div>
                                <label htmlFor={`deck-import-${formData.id}`} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-white/10 hover:bg-white/20 cursor-pointer">
                                    <UploadIcon /> Import
                                </label>
                                <input type="file" id={`deck-import-${formData.id}`} accept=".json" className="hidden" onChange={handleImportDeck} disabled={isGeneratingDeck}/>
                                <button onClick={handleExportDeck} disabled={isGeneratingDeck} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50">
                                    <ExportIcon /> Export
                                </button>
                                <button onClick={handleAddDeckToLibraryClick} disabled={isGeneratingDeck || !formData.deck?.cards?.length} className="py-1 px-3 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50" title="Save a copy of this deck to My Library (in the store screen) so it can be reused across realities">
                                    📚 To Library
                                </button>
                                <button onClick={handleAnalyzeDeck} disabled={isGeneratingDeck} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 disabled:opacity-50" title="Check the deck is winnable and losable at every difficulty">
                                    ⚖ Analyze
                                </button>
                                <button onClick={() => handleBulkArt(false)} disabled={isGeneratingDeck} className="py-1 px-3 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50" title="Apply one random art theme coherently across the whole deck">
                                    🎲 Random
                                </button>
                                <button onClick={() => handleBulkArt(true)} disabled={isGeneratingDeck} className="py-1 px-3 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50" title="Every card gets art from a different random theme">
                                    🌀 Chaos
                                </button>
                                <button onClick={handleRevertToAi} disabled={isGeneratingDeck} className="flex items-center gap-2 py-1 px-3 rounded-md text-sm bg-red-500/20 text-red-400 hover:bg-red-500/40 disabled:opacity-50">
                                    <DeleteIcon/> Revert to AI
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <input type="text" name="name" value={formData.deck?.name || ''} onChange={handleDeckFieldChange} placeholder="Deck Title" className="w-full bg-black/40 p-2 rounded text-lg font-bold" />
                            <textarea name="description" value={formData.deck?.description || ''} onChange={handleDeckFieldChange} placeholder="Deck Description..." className="w-full bg-black/40 p-2 rounded text-sm" rows={2}></textarea>
                            <div className="flex items-center gap-2 text-sm">
                                <label className="text-gray-400 whitespace-nowrap" title="Decks sharing a series name form a saga — finishing part N offers 'Next in the series' (part N+1) at game over">Series</label>
                                <input
                                    type="text"
                                    value={formData.deck?.series?.name || ''}
                                    onChange={e => handleDeckChange({ ...formData.deck!, series: e.target.value.trim() ? { name: e.target.value, part: formData.deck?.series?.part || 1 } : undefined })}
                                    placeholder="(optional) saga name, e.g. The Perimeter"
                                    className="flex-grow bg-black/40 p-1.5 rounded"
                                />
                                <label className="text-gray-400">Part</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={formData.deck?.series?.part || 1}
                                    onChange={e => formData.deck?.series?.name && handleDeckChange({ ...formData.deck!, series: { name: formData.deck.series.name, part: Math.max(1, parseInt(e.target.value, 10) || 1) } })}
                                    disabled={!formData.deck?.series?.name}
                                    className="w-16 bg-black/40 p-1.5 rounded disabled:opacity-40"
                                />
                            </div>
                        </div>

                        {deckAnalysis && (
                            <div className="mb-4 bg-black/30 border border-cyan-500/30 rounded-lg p-4 text-sm">
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
                            <div className="bg-black/30 p-4 rounded-lg border border-tarot-gold/25">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-bold text-tarot-gold-bright flex items-center gap-2"><GenerateIcon/> AI Story Director</h4>
                                    <button onClick={onOpenAISettings} className="text-sm text-gray-400 hover:text-white py-1 px-2 rounded-md hover:bg-white/10" title="Configure AI provider and API key">
                                        ⚙ AI Settings
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 mt-1 mb-2">Describe a high-level story. The AI will generate a full, complex deck. Best viewed in the Visual Editor.</p>
                                <textarea
                                    value={storyDirectorPrompt}
                                    onChange={(e) => setStoryDirectorPrompt(e.target.value)}
                                    className="w-full bg-black/40 p-2 rounded text-sm"
                                    rows={3}
                                    placeholder="e.g., A detective story where the player must find a killer. One path involves trusting a shady informant, leading to a trap..."
                                ></textarea>
                                <div className="flex items-center gap-2 mt-2">
                                    <label className="text-sm text-gray-400">Story length</label>
                                    <select
                                        value={deckSize}
                                        onChange={e => setDeckSize(Number(e.target.value))}
                                        className="bg-black/40 border border-white/10 p-1.5 rounded text-sm"
                                        disabled={isGeneratingDeck}
                                    >
                                        <option value={12}>Short — 12 cards (~3 min)</option>
                                        <option value={20}>Standard — 20 cards (~5 min)</option>
                                        <option value={30}>Long — 30 cards (~8 min)</option>
                                    </select>
                                    <label className="flex items-center gap-1.5 text-sm text-gray-400 ml-auto cursor-pointer" title="Match an art theme to your story from the built-in and store palettes (noir prompts get noir art). Uncheck to keep archetype-default art.">
                                        <input type="checkbox" checked={autoTheme} onChange={e => setAutoTheme(e.target.checked)} />
                                        Auto-theme art
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    One deck = one focused story arc (store limit: 50 cards). For an epic, plan the arcs outside the app
                                    (an AI chat is great for this), build each arc as its own deck, and link them with the <b>Series</b> fields
                                    above — players finishing part 1 get a "Next in the series" button leading to part 2.
                                </p>
                                <details className="mt-2">
                                    <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                        Source material (optional) — ground the deck in a short story, lecture notes, a workshop, a case study…
                                    </summary>
                                    <textarea
                                        value={sourceMaterial}
                                        onChange={(e) => setSourceMaterial(e.target.value)}
                                        className="w-full bg-black/40 p-2 rounded text-sm mt-2"
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