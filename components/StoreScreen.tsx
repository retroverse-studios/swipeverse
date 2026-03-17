import React, { useState, useEffect } from 'react';
import { Reality, Deck } from '../types';
import { fetchStoreRealities, fetchStoreDecks } from '../services/apiService';
import { BackIcon, AddIcon } from './icons';

interface StoreScreenProps {
  onExit: () => void;
  onAddReality: (reality: Reality) => void;
  onImportDeckToReality: (deck: Deck, realityId: string) => void;
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
            <p className="text-gray-400 mb-6">Select one of your existing realities to add this story to. It will replace any custom deck that reality currently has.</p>
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


const StoreScreen: React.FC<StoreScreenProps> = ({ onExit, onAddReality, onImportDeckToReality, localRealities }) => {
    const [storeRealities, setStoreRealities] = useState<Reality[]>([]);
    const [storeDecks, setStoreDecks] = useState<Deck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'realities' | 'stories'>('realities');
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

    const handleAddStoryClick = (deck: Deck) => {
        setSelectedDeck(deck);
    };

    const handleSelectRealityForDeck = (realityId: string) => {
        if (selectedDeck) {
            onImportDeckToReality(selectedDeck, realityId);
            setSelectedDeck(null);
        }
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
                        <p className="text-gray-300 mb-4 h-24 overflow-y-auto">{deck.description}</p>
                    </div>
                    <button
                        onClick={() => handleAddStoryClick(deck)}
                        className={`w-full mt-auto pt-4 flex items-center justify-center gap-2 py-3 px-6 font-bold text-lg rounded-md transition-colors duration-300 text-mystic-purple border-2 border-mystic-gold bg-transparent hover:bg-white/10`}
                    >
                       <AddIcon /> Add Story
                    </button>
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
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
            </div>
            <main className="flex-grow overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default StoreScreen;