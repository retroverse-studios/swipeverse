import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Reality, Stats, CardData, StatName, Deck } from '../types';
import { INITIAL_STATS, MIN_STAT_VALUE, MAX_STAT_VALUE, DEFAULT_SOUNDS, pickCardArt, cardScenesFor, resolveAssetUrl } from '../constants';
import { generateInitialDeck, getActiveProviderLabel, hasConfiguredProvider } from '../services/aiService';
import { Difficulty, applyDifficultyModifier } from '../services/gameHistory';
import StatBar from './StatBar';
import CardStack from './CardStack';
import { iconRegistry, ExitIcon } from './icons';

interface GameScreenProps {
  reality: Reality;
  difficulty: Difficulty;
  onGameOver: (reason: string, finalDeck: CardData[], won: boolean, turns: number, finalStats: Stats) => void;
  onExit: () => void;
  requestConfirmation: (options: { message: string, onConfirm: () => void }) => void;
  isMuted: boolean;
}

const LoadingSpinner: React.FC<{text: string}> = ({text}) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50 animate-fade-in">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-white mb-4"></div>
        <p className="text-lg text-white">{text}</p>
    </div>
);

const ErrorModal: React.FC<{
    reality: Reality;
    error: { message: string, canRetryWithAI: boolean, canUseBundled?: boolean };
    onExit: () => void;
    onRetry: () => void;
    onRetryWithAI: () => void;
    onUseBundled: () => void;
}> = ({ reality, error, onExit, onRetry, onRetryWithAI, onUseBundled }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 animate-fade-in p-4">
        <div className={`text-center max-w-lg p-8 rounded-lg border-2 ${reality.colors.accent} bg-slate-900/80 shadow-2xl`}>
            <h2 className={`text-3xl font-bold mb-4 ${reality.colors.primary}`}>Transmission Error</h2>
            <p className="text-lg text-gray-300 mb-8">{error.message}</p>
            <div className="flex justify-center gap-4 flex-wrap">
                <button
                    onClick={onExit}
                    className={`py-2 px-6 text-lg font-bold rounded-lg transition-colors duration-300 text-white border-2 border-gray-500 bg-transparent hover:bg-white/10`}
                >
                    Return to Menu
                </button>
                <button
                    onClick={onRetry}
                    className={`py-2 px-6 text-lg font-bold rounded-lg transition-colors duration-300 ${reality.colors.secondary} border-2 ${reality.colors.accent} bg-transparent hover:bg-white/10`}
                >
                    Try Again
                </button>
                {error.canRetryWithAI && (
                    <button
                        onClick={onRetryWithAI}
                        className={`py-2 px-6 text-lg font-bold rounded-lg transition-colors duration-300 ${reality.colors.secondary} border-2 ${reality.colors.accent} bg-transparent hover:bg-white/10 animate-pulse`}
                    >
                        Use AI Backup
                    </button>
                )}
                {error.canUseBundled && (
                    <button
                        onClick={onUseBundled}
                        className={`py-2 px-6 text-lg font-bold rounded-lg transition-colors duration-300 ${reality.colors.secondary} border-2 ${reality.colors.accent} bg-transparent hover:bg-white/10`}
                    >
                        Play Built-in Story
                    </button>
                )}
            </div>
        </div>
    </div>
);

const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
const audioContext = new AudioContextClass();

const GameScreen: React.FC<GameScreenProps> = ({ reality, difficulty, onGameOver, onExit, requestConfirmation, isMuted }) => {
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState('Conjuring reality...');
  const [deckLoadError, setDeckLoadError] = useState<{ message: string; canRetryWithAI: boolean; canUseBundled?: boolean } | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [forceAI, setForceAI] = useState(false);
  const [preferBundled, setPreferBundled] = useState(false);
  
  const [audioBuffers, setAudioBuffers] = useState<Record<string, AudioBuffer>>({});
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  const statKeys = useMemo(() => Object.keys(INITIAL_STATS) as StatName[], []);

  const playSound = useCallback((url: string | undefined) => {
    if (isMuted || !url || !audioBuffers[url]) return;
    try {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[url];
        source.connect(audioContext.destination);
        source.start(0);
    } catch(e) {
        console.error("Error playing sound:", e);
    }
  }, [isMuted, audioBuffers]);
  
  const handleGameOverWithSound = useCallback((reason: string, deck: CardData[], isWin: boolean, finalStats: Stats) => {
    const soundUrl = isWin
        ? reality.soundConfig?.gameWinUrl || DEFAULT_SOUNDS.win
        : reality.soundConfig?.gameLoseUrl || DEFAULT_SOUNDS.lose;
    playSound(soundUrl);
    onGameOver(reason, deck, isWin, turnCount, finalStats);
  }, [reality.soundConfig, playSound, onGameOver, turnCount]);

  const processAndSetDeck = useCallback((deckObject: Deck, onLoaded: () => void) => {
      const rawDeck = deckObject.cards;
      if (!Array.isArray(rawDeck) || rawDeck.length === 0) {
          setDeckLoadError({ message: "The received deck data was empty or invalid.", canRetryWithAI: !!(reality.deckUrl || reality.deck) });
          setIsLoading(false);
          return;
      }

      const processedDeck = rawDeck.map((card, index) => {
          // Image pool for untagged cards: the reality's own imageSet if it has
          // one, else the themed archetype scene set (base for custom realities)
          const imagePool = reality.imageSet && reality.imageSet.length > 0
              ? reality.imageSet
              : cardScenesFor(reality.id);
          const randomImageFromSet = imagePool[Math.floor(Math.random() * imagePool.length)];
          // Art priority: card's own image > themed archetype art > random from pool
          const archetypeArt = card.archetype ? pickCardArt(card.archetype, reality.id) : undefined;
          const chosenImage = card.imageUrl || archetypeArt || randomImageFromSet;

          return {
              ...card,
              id: `card-${Date.now()}-${index}`,
              imageUrl: chosenImage ? resolveAssetUrl(chosenImage) : undefined
          };
      });
      setDeck(processedDeck);
      setCurrentCardIndex(0);
      setDeckLoadError(null);
      onLoaded(); // This will trigger the final part of loading
  }, [reality.id, reality.deckUrl, reality.imageSet, reality.deck]);

  useEffect(() => {
    const loadAssets = async () => {
        setIsLoading(true);
        setDeckLoadError(null);
        let targetDeck: Deck | null = null;
        let deckSource: 'ai' | 'url' | 'local' = 'ai';

        // Bundled decks are zero-setup defaults; decks the player imported themselves
        // always take precedence, and a configured AI provider trumps the bundled deck
        // so returning players get a fresh story each run.
        const hasCards = !!(reality.deck && reality.deck.cards && reality.deck.cards.length > 0);
        const bundledDeck = hasCards && reality.deck!.source === 'bundled' ? reality.deck : undefined;
        const importedDeck = hasCards && reality.deck!.source !== 'bundled' ? reality.deck : undefined;

        if (preferBundled && bundledDeck) {
            setLoadingText('Loading built-in story...');
            targetDeck = bundledDeck;
            deckSource = 'local';
        } else if (!forceAI && importedDeck) {
            setLoadingText('Loading embedded narrative...');
            targetDeck = importedDeck;
            deckSource = 'local';
        } else if (!forceAI && reality.deckUrl) {
            setLoadingText(`Loading transmission from ${reality.name}...`);
            deckSource = 'url';
        } else if (!forceAI && bundledDeck && !hasConfiguredProvider()) {
            setLoadingText('Loading built-in story...');
            targetDeck = bundledDeck;
            deckSource = 'local';
        }

        try {
            if (deckSource === 'url' && reality.deckUrl) {
                const response = await fetch(reality.deckUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                targetDeck = await response.json();
            } else if (deckSource === 'ai') {
                setLoadingText(`Generating your story with ${getActiveProviderLabel()}... this can take a minute.`);
                targetDeck = await generateInitialDeck(reality, INITIAL_STATS);
            }

            if (!targetDeck || !targetDeck.cards || targetDeck.cards.length === 0) {
                 throw new Error("Deck is empty or invalid.");
            }
            
            setLoadingText("Preloading assets...");
            const soundUrlsToLoad = new Set<string>([
                DEFAULT_SOUNDS.start, DEFAULT_SOUNDS.swipe, DEFAULT_SOUNDS.win, DEFAULT_SOUNDS.lose,
                reality.soundConfig?.backgroundMusicUrl,
                reality.soundConfig?.gameStartUrl,
                reality.soundConfig?.gameWinUrl,
                reality.soundConfig?.gameLoseUrl,
                reality.soundConfig?.swipeLeftUrl,
                reality.soundConfig?.swipeRightUrl,
                ...targetDeck.cards.flatMap(c => [c.leftChoice.soundUrl, c.rightChoice.soundUrl])
            ].filter((url): url is string => !!url));

            const loadedBuffers: Record<string, AudioBuffer> = {};
            await Promise.all(
                Array.from(soundUrlsToLoad).map(async url => {
                    try {
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        loadedBuffers[url] = audioBuffer;
                    } catch (e) {
                        console.warn(`Failed to load or decode audio: ${url}`, e);
                    }
                })
            );
            setAudioBuffers(loadedBuffers);
            processAndSetDeck(targetDeck, () => {
                 setIsLoading(false);
                 playSound(reality.soundConfig?.gameStartUrl || DEFAULT_SOUNDS.start);
            });

        } catch (error) {
             console.error("Failed to load game assets:", error);
             setDeckLoadError({
                message: (error as Error).message || 'An unknown error occurred during loading.',
                canRetryWithAI: deckSource === 'url',
                canUseBundled: deckSource !== 'local' && !!bundledDeck
            });
            setIsLoading(false);
        }
    };
    loadAssets();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Re-runs on new reality or explicit retry only
  }, [reality, loadAttempt]);

  useEffect(() => {
    if(isLoading || isMuted || !reality.soundConfig?.backgroundMusicUrl) {
      bgmAudioRef.current?.pause();
      return;
    }

    if (!bgmAudioRef.current) {
        bgmAudioRef.current = new Audio(reality.soundConfig.backgroundMusicUrl);
        bgmAudioRef.current.loop = true;
    }
    bgmAudioRef.current.volume = 0.3;
    bgmAudioRef.current.play().catch(e => console.error("BGM failed to play:", e));

    return () => {
      bgmAudioRef.current?.pause();
      bgmAudioRef.current = null;
    }
  }, [isLoading, isMuted, reality.soundConfig?.backgroundMusicUrl]);


  const handleSwipe = useCallback((card: CardData, direction: 'left' | 'right') => {
    const choice = direction === 'left' ? card.leftChoice : card.rightChoice;
    const swipeSoundUrl = direction === 'left' 
        ? reality.soundConfig?.swipeLeftUrl 
        : reality.soundConfig?.swipeRightUrl;
    playSound(choice.soundUrl || swipeSoundUrl || DEFAULT_SOUNDS.swipe);
    
    // 1. Calculate new stats with difficulty modifier
    const newStats = { ...stats };
    for (const key in choice.effects) {
      const statName = key as StatName;
      const rawEffect = choice.effects[statName] || 0;
      const modifiedEffect = applyDifficultyModifier(rawEffect, difficulty);
      newStats[statName] = Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, newStats[statName] + modifiedEffect));
    }
    setStats(newStats);
    setTurnCount(prev => prev + 1);

    // 2. Check for game over from stats *after* update
    for (const key of statKeys) {
        const statName = key as StatName;
        if (newStats[statName] <= MIN_STAT_VALUE) {
          handleGameOverWithSound(`Your ${reality.statNames[statName].toLowerCase()} has vanished.`, deck, false, newStats);
          return;
        }
        if (newStats[statName] >= MAX_STAT_VALUE) {
          handleGameOverWithSound(`You've been overwhelmed by your ${reality.statNames[statName].toLowerCase()}.`, deck, false, newStats);
          return;
        }
    }

    // 3. Determine the next card index
    let nextIndex;
    if (typeof choice.nextCardIndex === 'number') {
        nextIndex = choice.nextCardIndex;
    } else {
        nextIndex = currentCardIndex + 1;
    }

    // 4. Check for win/loss based on next index
    if (nextIndex >= deck.length) {
        handleGameOverWithSound(`You have successfully navigated the challenges of ${reality.name} and reached the final node. Your story ends here.`, deck, true, newStats);
        return;
    }

    if (nextIndex < 0) {
        handleGameOverWithSound(`You chose a path that leads to nowhere and were lost to the void.`, deck, false, newStats);
        return;
    }

    // 5. Update the current card index
    setCurrentCardIndex(nextIndex);
  }, [stats, statKeys, reality, difficulty, deck, currentCardIndex, playSound, handleGameOverWithSound]);
  
  const handleExitClick = () => {
    requestConfirmation({
      message: "Are you sure you want to return to the void? Your current progress will be lost.",
      onConfirm: onExit,
    });
  };

  const currentCard = deck[currentCardIndex];

  return (
    <div className={`flex flex-col h-full w-full items-center justify-between p-4 md:p-8 relative ${reality.font}`}>
       <div className="absolute top-5 right-5 z-20 flex space-x-2">
            <button
                onClick={handleExitClick}
                className="p-2 rounded-full bg-black/30 text-gray-300 hover:text-white hover:bg-white/20 transition-colors duration-300 border-2 border-transparent hover:border-current"
                aria-label="Exit to main menu"
                title="Exit to Main Menu"
            >
                <ExitIcon />
            </button>
       </div>
       
       {isLoading && <LoadingSpinner text={loadingText} />}
       {deckLoadError && (
           <ErrorModal
                reality={reality}
                error={deckLoadError}
                onExit={onExit}
                onRetry={() => setLoadAttempt(n => n + 1)}
                onRetryWithAI={() => { setForceAI(true); setLoadAttempt(n => n + 1); }}
                onUseBundled={() => { setPreferBundled(true); setLoadAttempt(n => n + 1); }}
            />
        )}

      <div className={`w-full max-w-2xl flex justify-around p-4 rounded-xl bg-black/30 border-2 ${reality.colors.accent} backdrop-blur-md transition-opacity duration-300 ${isLoading || deckLoadError || !currentCard ? 'opacity-0' : 'opacity-100'}`}>
        {statKeys.map((key) => {
          const IconComponent = iconRegistry[reality.statIconNames[key as StatName]];
          return (
            <StatBar
              key={key}
              name={reality.statNames[key as StatName]}
              value={stats[key as StatName]}
              icon={IconComponent ? <IconComponent /> : null}
              color={reality.colors.secondary}
            />
          )
        })}
      </div>

      <div className={`flex-grow flex items-center justify-center w-full transition-opacity duration-300 ${isLoading || deckLoadError || !currentCard ? 'opacity-0' : 'opacity-100'}`}>
        {currentCard && 
            <CardStack
              cards={deck}
              currentIndex={currentCardIndex}
              onSwipe={handleSwipe}
              reality={reality}
            />
        }
      </div>

      <div className={`h-16 flex items-center justify-center text-gray-400 transition-opacity duration-300 ${isLoading || deckLoadError || !currentCard ? 'opacity-0' : 'opacity-100'}`}>
        {!isLoading && deck.length > 0 && <span>Node {currentCardIndex + 1} / {deck.length}</span>}
      </div>
    </div>
  );
};

export default GameScreen;