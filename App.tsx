import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Reality, CardData, Deck, LibraryDeck, ToastMessage } from './types';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import EditorScreen from './components/EditorScreen';
import StoreScreen from './components/StoreScreen';
import ConfirmationModal from './components/ConfirmationModal';
import { REALITIES, mergeStoredRealities } from './constants';
import { submitReality, fetchStoreDecks } from './services/apiService';
import { Difficulty, recordGame, GameSummary } from './services/gameHistory';
import AISettingsModal from './components/AISettingsModal';
import { VolumeOffIcon, VolumeOnIcon, CloseIcon } from './components/icons';
import { loadShellTheme, saveShellTheme, ShellThemeId } from './services/shellTheme';
import { ShellThemeContext, SHELL_BACKGROUNDS } from './components/ShellThemeContext';
import { buildLinkedReality } from './services/playLink';

const REALITIES_STORAGE_KEY = 'swipeverse-realities';
const DECK_LIBRARY_STORAGE_KEY = 'swipeverse-deck-library';
const MUTED_STORAGE_KEY = 'swipeverse-muted';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MainMenu);
  const [selectedReality, setSelectedReality] = useState<Reality | null>(null);
  const [editingReality, setEditingReality] = useState<Reality | null>(null);
  const [gameOverData, setGameOverData] = useState<{reason: string, deck: CardData[], summary: GameSummary | null}>({reason: '', deck: [], summary: null});
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('standard');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void; } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showAISettings, setShowAISettings] = useState(false);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
  }, []);

  const [shellTheme, setShellTheme] = useState<ShellThemeId>(loadShellTheme);

  useEffect(() => {
    saveShellTheme(shellTheme);
  }, [shellTheme]);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
        return window.localStorage.getItem(MUTED_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
  });

  useEffect(() => {
    try {
        window.localStorage.setItem(MUTED_STORAGE_KEY, JSON.stringify(isMuted));
    } catch (error) {
        console.error("Failed to save mute state to localStorage", error);
    }
  }, [isMuted]);

  const requestConfirmation = useCallback((options: { message: string; onConfirm: () => void; }) => {
    setConfirmation(options);
  }, []);

  const handleConfirmation = () => {
    if (confirmation) {
      confirmation.onConfirm();
      setConfirmation(null);
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmation(null);
  };

  const [realities, setRealities] = useState<Reality[]>(() => {
    try {
      const storedRealities = window.localStorage.getItem(REALITIES_STORAGE_KEY);
      return storedRealities ? mergeStoredRealities(JSON.parse(storedRealities)) : REALITIES;
    } catch (error) {
      console.error("Failed to load realities from localStorage", error);
      return REALITIES;
    }
  });

  const [deckLibrary, setDeckLibrary] = useState<LibraryDeck[]>(() => {
    try {
      const stored = window.localStorage.getItem(DECK_LIBRARY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load deck library from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(DECK_LIBRARY_STORAGE_KEY, JSON.stringify(deckLibrary));
    } catch (error) {
      console.error("Failed to save deck library to localStorage", error);
    }
  }, [deckLibrary]);

  // Ask the browser to exempt our storage (realities, deck library, settings)
  // from automatic eviction under storage pressure. Best-effort; a manual
  // "clear site data" still wipes it, hence the library export/import feature.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => { /* unsupported — ignore */ });
  }, []);

  // Direct play link: ?play=<scenario url> jumps straight into the game.
  const [playLinkLoading, setPlayLinkLoading] = useState<boolean>(
    () => new URLSearchParams(window.location.search).has('play')
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playUrl = params.get('play');
    if (!playUrl) return;

    const difficultyParam = params.get('difficulty');
    const difficulty: Difficulty =
      difficultyParam === 'easy' || difficultyParam === 'hard' ? difficultyParam : 'standard';
    const shellParam = params.get('shell');
    if (shellParam === 'tarot' || shellParam === 'crt' || shellParam === 'handheld') {
      setShellTheme(shellParam);
    }

    (async () => {
      try {
        const response = await fetch(playUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching the scenario`);
        const reality = buildLinkedReality(await response.json());
        setSelectedReality(reality); // ephemeral — never added to the collection
        setSelectedDifficulty(difficulty);
        setGameState(GameState.Playing);
      } catch (error) {
        addToast(`Couldn't open the linked scenario: ${(error as Error).message}`, 'error');
      } finally {
        setPlayLinkLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once at launch
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(REALITIES_STORAGE_KEY, JSON.stringify(realities));
    } catch (error) {
      console.error("Failed to save realities to localStorage", error);
    }
  }, [realities]);

  const handleStartGame = useCallback((reality: Reality, difficulty: Difficulty = 'standard') => {
    setSelectedReality(reality);
    setSelectedDifficulty(difficulty);
    setGameState(GameState.Playing);
  }, []);

  const handleGameOver = useCallback((reason: string, finalDeck: CardData[], won: boolean, turns: number, finalStats: import('./types').Stats) => {
    const summary = selectedReality
        ? recordGame(selectedReality.id, selectedReality.name, turns, finalStats, selectedDifficulty, won, reason)
        : null;

    if (summary) {
        for (const achievement of summary.newAchievements) {
            addToast(`Achievement unlocked: ${achievement.icon} ${achievement.name}`, 'success');
        }
    }

    setGameOverData({ reason, deck: finalDeck, summary });
    setGameState(GameState.GameOver);
  }, [selectedReality, selectedDifficulty, addToast]);

  /** Restart the same reality + difficulty (AI realities get a fresh story). */
  const handlePlayAgain = useCallback(() => {
    setGameOverData({ reason: '', deck: [], summary: null });
    setGameState(GameState.Playing);
  }, []);

  /** Continue a saga: play the resolved next deck in the same reality shell. */
  const handlePlayNextDeck = useCallback((deck: Deck) => {
    setSelectedReality(prev => prev ? { ...prev, deck: { ...deck } } : prev); // ephemeral, not saved
    setGameOverData({ reason: '', deck: [], summary: null });
    setGameState(GameState.Playing);
  }, []);

  /** Find part N+1 of the played deck's series: library first, then store. */
  const findNextInSeries = useCallback(async (deck: Deck): Promise<Deck | null> => {
    const series = deck.series;
    if (!series?.name || typeof series.part !== 'number') return null;
    const isNext = (candidate: Deck) =>
      candidate.series?.name?.trim().toLowerCase() === series.name.trim().toLowerCase() &&
      candidate.series?.part === series.part + 1;
    const fromLibrary = deckLibrary.find(entry => isNext(entry.deck));
    if (fromLibrary) return fromLibrary.deck;
    try {
      const storeDecks = await fetchStoreDecks();
      return storeDecks.find(isNext) ?? null;
    } catch {
      return null;
    }
  }, [deckLibrary]);

  const handleExitToMenu = useCallback(() => {
    setSelectedReality(null);
    setEditingReality(null);
    setGameOverData({reason: '', deck: [], summary: null});
    setGameState(GameState.MainMenu);
  }, []);
  
  const handleGoToEditor = useCallback((reality: Reality | null) => {
    setEditingReality(reality);
    setGameState(GameState.Editor);
  }, []);
  
  const handleGoToStore = useCallback(() => {
    setGameState(GameState.Store);
  }, []);

  const handleSaveReality = useCallback((realityToSave: Reality) => {
    setRealities(prev => {
        const exists = prev.some(r => r.id === realityToSave.id);
        if (exists) {
            return prev.map(r => r.id === realityToSave.id ? realityToSave : r);
        }
        return [...prev, realityToSave];
    });
    setEditingReality(realityToSave); // Keep the saved reality in view
  }, []);

  const handleDeleteReality = useCallback((realityId: string) => {
    if (realities.length <= 1) {
      addToast("You cannot delete the last reality!", 'error');
      return;
    }
    requestConfirmation({
      message: "Are you sure you want to permanently delete this reality? This cannot be undone.",
      onConfirm: () => {
        setRealities(prev => prev.filter(r => r.id !== realityId));
        setEditingReality(null);
        addToast("Reality deleted.", 'success');
      }
    });
  }, [realities.length, requestConfirmation, addToast]);

  const handleUpdateAllRealities = useCallback((newRealities: Reality[]) => {
      setRealities(newRealities);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    if (result.outcome === 'dismissed') return;
    setInstallPrompt(null);
  }, [installPrompt]);
  
  const handleAddRealityFromStore = (reality: Reality) => {
    const realityExists = realities.some(r => r.id === reality.id);
    if (realityExists) {
        requestConfirmation({
            message: `A reality with the ID "${reality.id}" already exists. Do you want to overwrite it?`,
            onConfirm: () => {
                setRealities(prev => prev.map(r => r.id === reality.id ? reality : r));
                addToast(`Reality "${reality.name}" has been updated!`);
            }
        });
    } else {
        setRealities(prev => [...prev, reality]);
        addToast(`Reality "${reality.name}" has been added to your game!`);
    }
  };

  const stripBundledTag = (deck: Deck): Deck => {
    const clean = { ...deck };
    delete clean.source;
    return clean;
  };

  const makeLibraryEntry = (deck: Deck): LibraryDeck => ({
    id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    addedAt: new Date().toISOString(),
    deck: stripBundledTag(deck),
  });

  const handleAddDeckToLibrary = (deck: Deck) => {
    setDeckLibrary(prev => [...prev, makeLibraryEntry(deck)]);
    addToast(`Story "${deck.name || 'Untitled'}" added to your library!`);
  };

  const handleDeleteLibraryDeck = (libraryDeckId: string) => {
    const entry = deckLibrary.find(d => d.id === libraryDeckId);
    requestConfirmation({
      message: `Delete "${entry?.deck.name || 'this story'}" from your library? Realities currently playing it keep their copy.`,
      onConfirm: () => {
        setDeckLibrary(prev => prev.filter(d => d.id !== libraryDeckId));
        addToast("Story removed from library.");
      }
    });
  };

  const handleImportLibrary = (decks: Deck[]) => {
    setDeckLibrary(prev => [...prev, ...decks.map(makeLibraryEntry)]);
    addToast(`${decks.length} ${decks.length === 1 ? 'story' : 'stories'} imported to your library!`);
  };

  const handleAssignDeckToReality = (deck: Deck, realityId: string) => {
    setRealities(prev => prev.map(r => {
        if (r.id === realityId) {
            return { ...r, deck: stripBundledTag(deck) };
        }
        return r;
    }));
    addToast(`Story "${deck.name}" is now playing in reality "${realities.find(r=>r.id === realityId)?.name}"!`);
  };
  
  const handleSubmitToStore = async (reality: Reality) => {
    requestConfirmation({
        message: "This will submit your reality to the public community store for review. Are you sure it's ready?",
        onConfirm: async () => {
            try {
                const response = await submitReality(reality);
                addToast(response.message, 'success');
            } catch (error) {
                addToast((error as Error).message, 'error');
            }
        }
    });
  };

  const renderContent = () => {
    if (playLinkLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-tarot-muted uppercase tracking-[0.3em] text-sm animate-pulse">Opening scenario…</p>
        </div>
      );
    }
    switch (gameState) {
      case GameState.Playing:
        if (selectedReality) {
          return <GameScreen reality={selectedReality} difficulty={selectedDifficulty} onGameOver={handleGameOver} onExit={handleExitToMenu} requestConfirmation={requestConfirmation} isMuted={isMuted} />;
        }
        return <MainMenu onStartGame={handleStartGame} onGoToEditor={handleGoToEditor} onGoToStore={handleGoToStore} onOpenAISettings={() => setShowAISettings(true)} realities={realities} installPrompt={installPrompt} onInstallClick={handleInstallClick} />;

      case GameState.GameOver:
        return <GameOverScreen reason={gameOverData.reason} onRestart={handleExitToMenu} onPlayAgain={handlePlayAgain} onPlayNext={handlePlayNextDeck} findNextInSeries={findNextInSeries} reality={selectedReality!} deck={gameOverData.deck} summary={gameOverData.summary} addToast={addToast} />;
      
      case GameState.Editor:
        return <EditorScreen 
                  realities={realities}
                  editingReality={editingReality}
                  onSetEditingReality={setEditingReality}
                  onSave={handleSaveReality}
                  onDelete={handleDeleteReality}
                  onUpdateAll={handleUpdateAllRealities}
                  onClose={handleExitToMenu}
                  requestConfirmation={requestConfirmation}
                  onSubmitToStore={handleSubmitToStore}
                  onAddDeckToLibrary={handleAddDeckToLibrary}
                  onOpenAISettings={() => setShowAISettings(true)}
                  addToast={addToast}
               />;
      
      case GameState.Store:
        return <StoreScreen
                  onExit={handleExitToMenu}
                  onAddReality={handleAddRealityFromStore}
                  onAddDeckToLibrary={handleAddDeckToLibrary}
                  deckLibrary={deckLibrary}
                  onAssignDeckToReality={handleAssignDeckToReality}
                  onDeleteLibraryDeck={handleDeleteLibraryDeck}
                  onImportLibrary={handleImportLibrary}
                  localRealities={realities}
               />;

      case GameState.MainMenu:
      default:
        return <MainMenu onStartGame={handleStartGame} onGoToEditor={handleGoToEditor} onGoToStore={handleGoToStore} onOpenAISettings={() => setShowAISettings(true)} realities={realities} installPrompt={installPrompt} onInstallClick={handleInstallClick} />;
    }
  };

  // Player-facing screens (menu, game, game over) take the shell theme's
  // backdrop; utility screens (editor, store) keep the neutral chrome.
  const isPlayerFacing = gameState === GameState.MainMenu || gameState === GameState.Playing || gameState === GameState.GameOver;
  let backgroundClass: string;
  if (!isPlayerFacing) {
    backgroundClass = (gameState === GameState.Editor && editingReality?.colors.background) || 'bg-velvet';
  } else if (shellTheme === 'tarot') {
    backgroundClass = (gameState === GameState.Playing && selectedReality?.colors.background) || 'bg-velvet';
  } else {
    backgroundClass = SHELL_BACKGROUNDS[shellTheme];
  }
  const fontClass = (gameState === GameState.Editor ? editingReality?.font : undefined) || 'font-exo';

  return (
    <ShellThemeContext.Provider value={{ shellTheme, setShellTheme }}>
    <main className={`w-screen h-screen overflow-hidden ${backgroundClass} ${fontClass} text-white transition-all duration-500`}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <button 
        onClick={() => setIsMuted(prev => !prev)}
        className="absolute bottom-4 left-4 z-[101] p-2 rounded-full bg-black/30 text-gray-300 hover:text-white hover:bg-white/20 transition-colors duration-300"
        aria-label={isMuted ? "Unmute" : "Mute"}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>
      
      <div className="absolute top-4 right-4 z-[100] w-full max-w-sm space-y-2">
            {toasts.map(toast => (
                <div key={toast.id} className={`rounded-lg shadow-lg p-3 animate-fade-in flex items-start space-x-4 ${toast.type === 'success' ? 'bg-green-600/95 border border-green-400' : 'bg-red-600/95 border border-red-400'}`}>
                    <p className="flex-grow text-sm font-semibold">{toast.message}</p>
                    <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="flex-shrink-0">
                      <CloseIcon />
                    </button>
                </div>
            ))}
      </div>

      <div className="relative z-10 h-full">
        {renderContent()}
        {confirmation && (
          <ConfirmationModal
            message={confirmation.message}
            onConfirm={handleConfirmation}
            onCancel={handleCancelConfirmation}
          />
        )}
        {showAISettings && (
          <AISettingsModal
            onClose={() => setShowAISettings(false)}
            addToast={addToast}
          />
        )}
      </div>
    </main>
    </ShellThemeContext.Provider>
  );
};

export default App;