import React, { useState, useEffect } from 'react';
import { Reality, Deck, LibraryDeck } from '../types';
import { fetchStoreRealities, fetchStoreDecks } from '../services/apiService';
import { BackIcon, AddIcon, ExportIcon, UploadIcon, DeleteIcon } from './icons';

interface StoreScreenProps {
  onExit: () => void;
  onAddReality: (reality: Reality) => void;
  onAddDeckToLibrary: (deck: Deck) => void;
  deckLibrary: LibraryDeck[];
  onAssignDeckToReality: (deck: Deck, realityId: string) => void;
  onDeleteLibraryDeck: (libraryDeckId: string) => void;
  onImportLibrary: (decks: Deck[]) => void;
  localRealities: Reality[];
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-mystic-purple mb-4"></div>
        <p className="text-lg text-white">Connecting to Community Store...</p>
    </div>
);

const SelectRealityModal: React.FC<{
    realities: Reality[];
    onSelect: (realityId: string) => void;
    onCancel: () => void;
}> = ({ realities, onSelect, onCancel }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-slate-900 border-2 border-mystic-purple rounded-lg shadow-2xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-mystic-purple">Add Story To...</h2>
            <p className="text-gray-400 mb-6">Select one of your existing realities to play this story in. It replaces the deck currently loaded in that reality — your library copy is kept.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 mb-6">
                {realities.map(reality => (
                    <button 
                        key={reality.id} 
                        onClick={() => onSelect(reality.id)}
                        className={`w-full text-left p-3 rounded-md border-l-4 transition-colors ${reality.colors.accent} bg-black/20 hover:bg-white/10`}
                    >
                       <span className="font-bold">{reality.name}</span>
                       <span className="text-sm text-gray-400 block">{reality.description}</span>
                    </button>
                ))}
            </div>
            <button onClick={onCancel} className="w-full py-2 px-4 rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
        </div>
    </div>
);


const StoreScreen: React.FC<StoreScreenProps> = ({ onExit, onAddReality, onAddDeckToLibrary, deckLibrary, onAssignDeckToReality, onDeleteLibraryDeck, onImportLibrary, localRealities }) => {
    const [storeRealities, setStoreRealities] = useState<Reality[]>([]);
    const [storeDecks, setStoreDecks] = useState<Deck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'realities' | 'stories' | 'library'>('realities');
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

    useEffect(() => {
        const loadStoreData = async () => {
            setIsLoading(true);
            try {
                const [realitiesData, decksData] = await Promise.all([
                    fetchStoreRealities(),
                    fetchStoreDecks()
                ]);
                setStoreRealities(realitiesData);
                setStoreDecks(decksData);
            } catch {
                setError("Could not connect to the community store. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        loadStoreData();
    }, []);

    const handleSelectRealityForDeck = (realityId: string) => {
        if (selectedDeck) {
            onAssignDeckToReality(selectedDeck, realityId);
            setSelectedDeck(null);
        }
    };

    const downloadJson = (data: unknown, filename: string) => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = filename;
        link.click();
        link.remove();
    };

    const handleExportLibrary = () => {
        downloadJson(deckLibrary.map(entry => entry.deck), "swipeverse-library.json");
    };

    const [libraryImportError, setLibraryImportError] = useState<string | null>(null);

    const handleImportLibraryFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                // Accept a library export (Deck[]), LibraryDeck[] entries, or a single deck
                const items: unknown[] = Array.isArray(data) ? data : [data];
                const decks = items
                    .map(item => {
                        if (item && typeof item === 'object' && 'cards' in item) return item as Deck;
                        if (item && typeof item === 'object' && 'deck' in item) return (item as LibraryDeck).deck;
                        return null;
                    })
                    .filter((d): d is Deck => !!d && Array.isArray(d.cards) && d.cards.length > 0);
                if (decks.length === 0) throw new Error("No decks found");
                setLibraryImportError(null);
                onImportLibrary(decks);
            } catch {
                setLibraryImportError("Could not import: the file doesn't contain any valid decks.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const renderRealities = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storeRealities.map((reality) => (
                <div
                    key={reality.id}
                    className={`flex flex-col justify-between p-6 border-2 ${reality.colors.accent} bg-black/40 rounded-lg shadow-lg backdrop-blur-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${reality.font}`}
                >
                    <div>
                        <h2 className={`text-3xl font-bold ${reality.colors.secondary} mb-2`}>{reality.name}</h2>
                        {reality.category === 'education' && (
                            <span className="inline-block mb-2 text-[0.62rem] font-bold tracking-widest uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 rounded px-2 py-0.5">Education</span>
                        )}
                        <p className="text-gray-300 mb-4 h-24 overflow-y-auto">{reality.description}</p>
                    </div>
                    <button
                        onClick={() => onAddReality(reality)}
                        className={`w-full mt-auto pt-4 flex items-center justify-center gap-2 py-3 px-6 font-bold text-lg rounded-md transition-colors duration-300 ${reality.colors.primary} border-2 ${reality.colors.accent} bg-transparent hover:bg-white/10`}
                    >
                       <AddIcon /> Add Reality
                    </button>
                </div>
            ))}
        </div>
    );

    const renderStories = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storeDecks.map((deck, index) => (
                <div
                    key={`${deck.name}-${index}`}
                    className={`flex flex-col justify-between p-6 border-2 border-mystic-gold bg-black/40 rounded-lg shadow-lg backdrop-blur-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 font-exo`}
                >
                    <div>
                        <h2 className={`text-3xl font-bold text-mystic-gold mb-2`}>{deck.name}</h2>
                        {deck.category === 'education' && (
                            <span className="inline-block mb-2 text-[0.62rem] font-bold tracking-widest uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 rounded px-2 py-0.5">Education</span>
                        )}
                        <p className="text-gray-300 mb-4 h-24 overflow-y-auto">{deck.description}</p>
                    </div>
                    <button
                        onClick={() => onAddDeckToLibrary(deck)}
                        className={`w-full mt-auto pt-4 flex items-center justify-center gap-2 py-3 px-6 font-bold text-lg rounded-md transition-colors duration-300 text-mystic-purple border-2 border-mystic-gold bg-transparent hover:bg-white/10`}
                    >
                       <AddIcon /> Add to Library
                    </button>
                </div>
            ))}
        </div>
    );

    const renderLibrary = () => (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <button onClick={handleExportLibrary} disabled={deckLibrary.length === 0}
                    className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-bold bg-white/10 hover:bg-white/20 disabled:opacity-50">
                    <ExportIcon /> Export Library
                </button>
                <label htmlFor="library-import"
                    className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-bold bg-white/10 hover:bg-white/20 cursor-pointer">
                    <UploadIcon /> Import
                </label>
                <input type="file" id="library-import" accept=".json" className="hidden" onChange={handleImportLibraryFile} />
                <p className="text-xs text-gray-500 ml-2">Your library lives in this browser — export it to keep a backup on disk.</p>
            </div>
            {libraryImportError && <p className="text-red-400 mb-4">{libraryImportError}</p>}
            {deckLibrary.length === 0 ? (
                <div className="text-center text-gray-400 text-lg py-16">
                    Your library is empty. Add stories from the <button onClick={() => setView('stories')} className="underline text-mystic-gold">Stories</button> tab,
                    or import a backup from disk.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deckLibrary.map((entry) => (
                        <div key={entry.id}
                            className="flex flex-col justify-between p-6 border-2 border-mystic-gold bg-black/40 rounded-lg shadow-lg backdrop-blur-md font-exo">
                            <div>
                                <h2 className="text-2xl font-bold text-mystic-gold mb-2">{entry.deck.name || 'Untitled Story'}</h2>
                                <p className="text-gray-300 mb-2 h-20 overflow-y-auto">{entry.deck.description}</p>
                                <p className="text-xs text-gray-500 mb-4">{entry.deck.cards.length} cards · added {new Date(entry.addedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => setSelectedDeck(entry.deck)}
                                    className="flex-grow py-2 px-3 font-bold rounded-md text-mystic-purple border-2 border-mystic-gold bg-transparent hover:bg-white/10">
                                    Load into Reality
                                </button>
                                <button
                                    onClick={() => downloadJson(entry.deck, `deck-${(entry.deck.name || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`)}
                                    title="Export this story to disk"
                                    className="py-2 px-3 rounded-md bg-white/10 hover:bg-white/20">
                                    <ExportIcon />
                                </button>
                                <button
                                    onClick={() => onDeleteLibraryDeck(entry.id)}
                                    title="Delete from library"
                                    className="py-2 px-3 rounded-md bg-white/10 hover:bg-red-500/40">
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        if (view === 'library') return renderLibrary();
        if (isLoading) return <LoadingSpinner />;
        if (error) return <div className="text-center text-red-400 text-xl">{error}</div>;

        return view === 'realities' ? renderRealities() : renderStories();
    }

    return (
        <div className="flex flex-col h-full w-full p-4 md:p-8 animate-fade-in">
             {selectedDeck && (
                <SelectRealityModal 
                    realities={localRealities} 
                    onSelect={handleSelectRealityForDeck}
                    onCancel={() => setSelectedDeck(null)}
                />
            )}
            <header className="flex items-center mb-6">
                <button onClick={onExit} className="p-2 mr-4 rounded-full hover:bg-white/10"><BackIcon /></button>
                <div>
                    <h1 className="text-5xl font-bold font-orbitron text-shadow">Community Store</h1>
                    <p className="text-gray-400">Discover realities and stories crafted by other creators.</p>
                </div>
            </header>
            <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800">
                <button onClick={() => setView('realities')} className={`py-2 px-4 font-bold text-lg transition-colors ${view === 'realities' ? 'border-b-2 border-cyber-pink text-white' : 'text-gray-500'}`}>Realities</button>
                <button onClick={() => setView('stories')} className={`py-2 px-4 font-bold text-lg transition-colors ${view === 'stories' ? 'border-b-2 border-cyber-pink text-white' : 'text-gray-500'}`}>Stories</button>
                <button onClick={() => setView('library')} className={`py-2 px-4 font-bold text-lg transition-colors ${view === 'library' ? 'border-b-2 border-cyber-pink text-white' : 'text-gray-500'}`}>My Library{deckLibrary.length > 0 ? ` (${deckLibrary.length})` : ''}</button>
            </div>
            <main className="flex-grow overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default StoreScreen;