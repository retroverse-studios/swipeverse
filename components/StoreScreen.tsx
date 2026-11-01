import React, { useState, useEffect, useMemo } from 'react';
import { Reality, Deck, LibraryDeck } from '../types';
import { fetchStoreRealities, fetchStoreDecks } from '../services/apiService';
import { validateAndRepairDeck } from '../services/aiProvider';
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

/** A random piece of card art from the deck, to give its tile a face. */
const randomCardArt = (deck?: Deck): string | undefined => {
    const art = deck?.cards.map(c => c.imageUrl).filter((url): url is string => !!url) ?? [];
    if (art.length === 0) return undefined;
    return art[Math.floor(Math.random() * art.length)];
};

const TileArt: React.FC<{ src?: string; alt: string }> = ({ src, alt }) =>
    src ? (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            draggable={false}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="w-full h-32 object-cover rounded-md mb-4 border border-white/10"
        />
    ) : null;

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-tarot-gold mb-4"></div>
        <p className="text-lg text-white">Connecting to Community Store...</p>
    </div>
);

const SelectRealityModal: React.FC<{
    realities: Reality[];
    onSelect: (realityId: string) => void;
    onCancel: () => void;
}> = ({ realities, onSelect, onCancel }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-tarot-velvet-2 border-2 border-tarot-gold rounded-lg shadow-2xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 font-cinzel text-tarot-gold-bright">Add Story To...</h2>
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



type CategoryFilter = 'all' | 'game' | 'education';

/** Deterministic PRNG so the featured rotation is stable within a week. */
function mulberry32(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

/** This week's featured realities: a seeded rotation so every reality gets
 *  its turn in the spotlight without a backend or manual curation. */
function weeklyFeatured<T>(items: T[], count: number): T[] {
    if (items.length <= count) return items;
    const now = new Date();
    const week = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 604_800_000);
    const rand = mulberry32(week * 7919);
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

const Shelf: React.FC<{ id: string; title: string; blurb?: string; children: React.ReactNode }> = ({ id, title, blurb, children }) => (
    <section id={id} className="mb-12 scroll-mt-4">
        <div className="flex items-baseline gap-3 mb-4 border-b border-tarot-gold/25 pb-2">
            <h2 className="text-2xl font-bold font-cinzel text-tarot-gold-bright tracking-wide">{title}</h2>
            {blurb && <p className="text-sm text-gray-500 hidden md:block">{blurb}</p>}
        </div>
        {children}
    </section>
);

const StoreScreen: React.FC<StoreScreenProps> = ({ onExit, onAddReality, onAddDeckToLibrary, deckLibrary, onAssignDeckToReality, onDeleteLibraryDeck, onImportLibrary, localRealities }) => {
    const [storeRealities, setStoreRealities] = useState<Reality[]>([]);
    const [storeDecks, setStoreDecks] = useState<Deck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [search, setSearch] = useState('');
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

    // Pick once per fetch, not per render, so tiles keep their art while browsing.
    const realityArt = useMemo(
        () => new Map(storeRealities.map(r => [r.id, randomCardArt(r.deck)])),
        [storeRealities]
    );
    const storyArt = useMemo(
        () => new Map(storeDecks.map(d => [d, randomCardArt(d)])),
        [storeDecks]
    );
    const libraryArt = useMemo(
        () => new Map(deckLibrary.map(entry => [entry.id, randomCardArt(entry.deck)])),
        [deckLibrary]
    );

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
                        const raw = item && typeof item === 'object' && 'cards' in item
                            ? item as Deck
                            : item && typeof item === 'object' && 'deck' in item
                                ? (item as LibraryDeck).deck
                                : null;
                        if (!raw || !Array.isArray(raw.cards) || raw.cards.length === 0) return null;
                        try { return validateAndRepairDeck(raw); } catch { return null; }
                    })
                    .filter((d): d is Deck => d !== null);
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

    // ── Browse model: one page of shelves (featured / games / education /
    // sagas / library) with a category filter and search across everything.
    const query = search.trim().toLowerCase();
    const matchesSearch = (name?: string, description?: string) =>
        !query || `${name ?? ''} ${description ?? ''}`.toLowerCase().includes(query);
    const inCategory = (category?: string) =>
        categoryFilter === 'all' || (category ?? 'game') === categoryFilter;

    const visibleRealities = storeRealities.filter(
        r => inCategory(r.category) && matchesSearch(r.name, r.description)
    );
    const visibleDecks = storeDecks.filter(
        d => inCategory(d.category) && matchesSearch(d.name, d.description)
    );
    const showFeatured = categoryFilter === 'all' && !query && visibleRealities.length > 3;
    const featured = showFeatured ? weeklyFeatured(visibleRealities, 3) : [];
    const featuredIds = new Set(featured.map(r => r.id));
    const gameRealities = visibleRealities.filter(r => (r.category ?? 'game') === 'game' && !featuredIds.has(r.id));
    const educationRealities = visibleRealities.filter(r => r.category === 'education' && !featuredIds.has(r.id));
    const educationDecks = visibleDecks.filter(d => d.category === 'education');
    const standaloneDecks = visibleDecks.filter(d => (d.category ?? 'game') === 'game' && !d.series);
    const sagas = new Map<string, Deck[]>();
    for (const deck of visibleDecks) {
        if (!deck.series?.name) continue;
        const parts = sagas.get(deck.series.name) ?? [];
        parts.push(deck);
        sagas.set(deck.series.name, parts);
    }
    for (const parts of sagas.values()) parts.sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0));
    const visibleLibrary = deckLibrary.filter(
        e => inCategory(e.deck.category) && matchesSearch(e.deck.name, e.deck.description)
    );
    const nothingVisible =
        !isLoading && !error &&
        visibleRealities.length === 0 && visibleDecks.length === 0 && visibleLibrary.length === 0;

    const scrollToShelf = (id: string) =>
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const realityTile = (reality: Reality) => (
        <div
            key={reality.id}
            className={`flex flex-col justify-between p-6 border-2 ${reality.colors.accent} bg-black/40 rounded-lg shadow-lg backdrop-blur-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${reality.font}`}
        >
            <div>
                <TileArt src={realityArt.get(reality.id)} alt={`${reality.name} card art`} />
                <h3 className={`text-3xl font-bold ${reality.colors.secondary} mb-2`}>{reality.name}</h3>
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
    );

    const deckTile = (deck: Deck) => (
        <div
            key={`${deck.name}-${deck.series?.part ?? ''}`}
            className="flex flex-col justify-between p-6 border-2 border-tarot-gold bg-black/40 rounded-lg shadow-lg backdrop-blur-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 font-exo"
        >
            <div>
                <TileArt src={storyArt.get(deck)} alt={`${deck.name} card art`} />
                <h3 className="text-3xl font-bold text-tarot-gold-bright mb-2">{deck.name}</h3>
                {deck.category === 'education' && (
                    <span className="inline-block mb-2 text-[0.62rem] font-bold tracking-widest uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 rounded px-2 py-0.5">Education</span>
                )}
                <p className="text-gray-300 mb-4 h-24 overflow-y-auto">{deck.description}</p>
            </div>
            <button
                onClick={() => onAddDeckToLibrary(deck)}
                className="w-full mt-auto pt-4 flex items-center justify-center gap-2 py-3 px-6 font-bold text-lg rounded-md transition-colors duration-300 text-tarot-gold-bright border-2 border-tarot-gold bg-transparent hover:bg-white/10"
            >
               <AddIcon /> Add to Library
            </button>
        </div>
    );

    const renderLibraryShelf = () => (
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
                <div className="text-center text-gray-400 text-lg py-10">
                    Your library is empty. Add stories from the shelves above, or import a backup from disk.
                </div>
            ) : visibleLibrary.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No library stories match your search.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleLibrary.map((entry) => (
                        <div key={entry.id}
                            className="flex flex-col justify-between p-6 border-2 border-tarot-gold bg-black/40 rounded-lg shadow-lg backdrop-blur-md font-exo">
                            <div>
                                <TileArt src={libraryArt.get(entry.id)} alt={`${entry.deck.name || 'Untitled Story'} card art`} />
                                <h3 className="text-2xl font-bold text-tarot-gold-bright mb-2">{entry.deck.name || 'Untitled Story'}</h3>
                                <p className="text-gray-300 mb-2 h-20 overflow-y-auto">{entry.deck.description}</p>
                                <p className="text-xs text-gray-500 mb-4">{entry.deck.cards.length} cards · added {new Date(entry.addedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => setSelectedDeck(entry.deck)}
                                    className="flex-grow py-2 px-3 font-bold rounded-md text-tarot-gold-bright border-2 border-tarot-gold bg-transparent hover:bg-white/10">
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

    const grid = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

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
                <button onClick={onExit} className="p-2 mr-4 rounded-full hover:bg-white/10" aria-label="Back"><BackIcon /></button>
                <div>
                    <h1 className="text-5xl font-extrabold font-cinzel text-gold-gradient">Community Store</h1>
                    <p className="text-gray-400">Discover realities and stories crafted by other creators.</p>
                </div>
            </header>

            {/* Filter bar: search + Games/Education split + shelf shortcuts */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search realities & stories…"
                    aria-label="Search the store"
                    className="flex-grow min-w-48 bg-black/40 border border-tarot-gold/40 rounded-md px-4 py-2 text-white placeholder:text-gray-500 focus:border-tarot-gold focus:outline-none"
                />
                {(['all', 'game', 'education'] as CategoryFilter[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setCategoryFilter(f)}
                        className={`py-2 px-4 rounded-full text-sm font-bold border transition-colors ${categoryFilter === f ? 'bg-tarot-gold text-tarot-velvet border-tarot-gold' : 'border-white/20 text-gray-400 hover:border-tarot-gold/60'}`}
                    >
                        {f === 'all' ? 'All' : f === 'game' ? '🎮 Games' : '🎓 Education'}
                    </button>
                ))}
                <span className="flex-grow" />
                <button onClick={() => scrollToShelf('store-library')} className="py-2 px-4 rounded-full text-sm font-bold border border-white/20 text-gray-300 hover:border-tarot-gold/60">
                    My Library{deckLibrary.length > 0 ? ` (${deckLibrary.length})` : ''} ↓
                </button>
            </div>

            <main className="flex-grow overflow-y-auto pr-1">
                {isLoading ? <LoadingSpinner /> : error ? (
                    <div className="text-center text-red-400 text-xl py-10">{error}</div>
                ) : (
                    <>
                        {showFeatured && featured.length > 0 && (
                            <Shelf id="store-featured" title="★ Featured this week" blurb="A rotating spotlight — every reality gets its turn">
                                <div className={grid}>{featured.map(realityTile)}</div>
                            </Shelf>
                        )}

                        {gameRealities.length > 0 && (
                            <Shelf id="store-games" title="🎮 Games" blurb="Full realities with their own stats, art and stories">
                                <div className={grid}>{gameRealities.map(realityTile)}</div>
                            </Shelf>
                        )}

                        {(educationRealities.length > 0 || educationDecks.length > 0) && (
                            <Shelf id="store-education" title="🎓 Education" blurb="Classroom-ready scenarios that teach by dilemma, not quiz">
                                <div className={grid}>
                                    {educationRealities.map(realityTile)}
                                    {educationDecks.map(deckTile)}
                                </div>
                            </Shelf>
                        )}

                        {standaloneDecks.length > 0 && (
                            <Shelf id="store-stories" title="📖 Story decks" blurb="Standalone stories — add to your library, play in any reality">
                                <div className={grid}>{standaloneDecks.map(deckTile)}</div>
                            </Shelf>
                        )}

                        {sagas.size > 0 && (
                            <Shelf id="store-sagas" title="📚 Sagas" blurb="Multi-part stories — finish one part to unlock the next">
                                <div className="space-y-6">
                                    {[...sagas.entries()].map(([name, parts]) => (
                                        <div key={name} className="border-2 border-tarot-gold/50 bg-black/30 rounded-lg p-5">
                                            <h3 className="text-xl font-bold font-cinzel text-tarot-gold-bright mb-1">{name}</h3>
                                            <p className="text-sm text-gray-400 mb-4">{parts[0].description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {parts.map(part => (
                                                    <button
                                                        key={part.series?.part}
                                                        onClick={() => onAddDeckToLibrary(part)}
                                                        className="flex items-center gap-2 py-2 px-4 rounded-full text-sm font-bold border border-tarot-gold/60 text-tarot-gold-bright hover:bg-white/10"
                                                    >
                                                        <AddIcon /> Part {part.series?.part}: {part.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Shelf>
                        )}

                        {nothingVisible && (
                            <div className="text-center text-gray-400 text-lg py-16">
                                Nothing matches “{search}”. Try a different search or filter.
                            </div>
                        )}
                    </>
                )}

                <Shelf id="store-library" title={`My Library${deckLibrary.length > 0 ? ` (${deckLibrary.length})` : ''}`} blurb="Stories you've collected — load one into any reality">
                    {renderLibraryShelf()}
                </Shelf>
            </main>
        </div>
    );
};

export default StoreScreen;
