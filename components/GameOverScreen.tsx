import React, { useEffect, useState } from 'react';
import { Reality, CardData, Deck } from '../types';
import { GameSummary } from '../services/gameHistory';
import { ExportIcon } from './icons';
import { useShellTheme } from './ShellThemeContext';
import { ShellThemeId } from '../services/shellTheme';
import { CrtShell, HandheldShell } from './shells';

interface GameOverScreenProps {
  reason: string;
  reality: Reality;
  onRestart: () => void;
  onPlayAgain: () => void;
  onPlayNext: (deck: Deck) => void;
  findNextInSeries: (deck: Deck) => Promise<Deck | null>;
  deck: CardData[];
  summary: GameSummary | null;
  addToast: (message: string, type: 'success' | 'error') => void;
}

const CHROME: Record<ShellThemeId, {
  titleWin: string;
  titleLoss: string;
  reason: string;
  box: string;
  boxValue: string;
  boxLabel: string;
  meta: string;
  primaryBtn: string;
  secondaryBtn: string;
  winText: string;
  lossText: string;
}> = {
  tarot: {
    titleWin: 'font-cinzel font-extrabold text-5xl md:text-7xl text-gold-gradient',
    titleLoss: 'font-cinzel font-extrabold text-5xl md:text-7xl text-[var(--tarot-danger)]',
    reason: 'text-xl md:text-2xl text-tarot-paper',
    box: 'tarot-plaque rounded-lg p-3',
    boxValue: 'text-2xl font-cinzel font-bold text-tarot-gold-bright',
    boxLabel: 'text-[0.6rem] text-tarot-muted uppercase tracking-[0.2em]',
    meta: 'text-sm text-tarot-muted',
    primaryBtn: 'tarot-plaque rounded-lg py-3 px-8 text-lg font-cinzel font-semibold text-tarot-gold-bright',
    secondaryBtn: 'rounded-lg py-3 px-6 text-lg border border-tarot-muted/40 text-tarot-muted hover:text-tarot-paper hover:border-tarot-muted',
    winText: 'The Cards Favour You',
    lossText: 'The Reading Ends',
  },
  crt: {
    titleWin: 'font-pixel text-3xl md:text-5xl text-[#7fe7f5] crt-glow-pink',
    titleLoss: 'font-pixel text-3xl md:text-5xl text-cyber-pink crt-glow-pink',
    reason: 'font-vt text-xl md:text-2xl text-[#dfe6f5]',
    box: 'border border-[#7fe7f5]/40 bg-[#0d1120] p-3',
    boxValue: 'font-vt text-3xl text-white',
    boxLabel: 'font-vt text-sm text-[#5f6a80] tracking-[0.2em]',
    meta: 'font-vt text-lg text-[#5f6a80]',
    primaryBtn: 'font-pixel text-[10px] py-4 px-8 border-2 border-cyber-pink text-cyber-pink hover:bg-cyber-pink/10 animate-blink',
    secondaryBtn: 'font-vt text-xl py-3 px-6 border border-[#5f6a80] text-[#aab3c7] hover:text-white',
    winText: 'YOU WIN',
    lossText: 'GAME OVER',
  },
  handheld: {
    titleWin: 'font-pixel text-lg md:text-2xl hh-green',
    titleLoss: 'font-pixel text-lg md:text-2xl text-[#ff8f6b]',
    reason: 'font-vt text-lg md:text-xl text-[#cfe8d5]',
    box: 'border border-[#a3ffbe]/25 bg-[#16241b] p-2.5',
    boxValue: 'font-vt text-2xl text-[#a3ffbe]',
    boxLabel: 'font-vt text-xs text-[#5c8a6b] tracking-[0.15em]',
    meta: 'font-vt text-base text-[#5c8a6b]',
    primaryBtn: 'font-pixel text-[9px] py-3 px-6 border-2 border-[#a3ffbe]/60 text-[#a3ffbe] hover:bg-[#a3ffbe]/10',
    secondaryBtn: 'font-vt text-lg py-2.5 px-5 border border-[#5c8a6b] text-[#5c8a6b] hover:text-[#a3ffbe]',
    winText: 'YOU WIN!',
    lossText: 'GAME OVER',
  },
};

const NEXT_LABEL: Record<ShellThemeId, string> = {
  tarot: 'Next Chapter ✦',
  crt: 'NEXT STAGE ▶',
  handheld: 'NEXT LEVEL',
};

const MENU_LABEL: Record<ShellThemeId, string> = {
  tarot: 'Return to the Void',
  crt: 'MENU',
  handheld: 'MENU',
};

const GameOverScreen: React.FC<GameOverScreenProps> = ({ reason, reality, onRestart, onPlayAgain, onPlayNext, findNextInSeries, deck, summary, addToast }) => {
  const { shellTheme } = useShellTheme();
  const chrome = CHROME[shellTheme];
  const [nextDeck, setNextDeck] = useState<Deck | null>(null);

  useEffect(() => {
    let alive = true;
    if (reality.deck) {
      findNextInSeries(reality.deck).then(next => { if (alive) setNextDeck(next); });
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve once per game over
  }, []);

  const handleExportDeck = () => {
    if (!deck || deck.length === 0) {
      addToast("No story deck to export.", 'error');
      return;
    }
    const deckToExport: Deck = {
        name: reality.deck?.name || "Exported Story",
        description: reality.deck?.description || `A story played in the ${reality.name} reality.`,
        cards: deck.map(({ prompt, archetype, imageUrl, leftChoice, rightChoice }) => ({
            prompt, archetype, imageUrl, leftChoice, rightChoice
        }))
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(deckToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `story-${reality.id}-${Date.now()}.json`;
    link.click();
    link.remove();
  };

  const record = summary?.record;
  const stats = summary?.stats;

  const content = (
    <div className="flex flex-col items-center justify-center min-h-full text-center p-4 animate-fade-in">
      <h1 className={`mb-4 ${record?.won ? chrome.titleWin : chrome.titleLoss}`}>
        {record?.won ? chrome.winText : chrome.lossText}
      </h1>
      <p className={`mb-6 max-w-xl ${chrome.reason}`}>{reason}</p>

      {record && stats && (
        <div className="mb-8 max-w-md w-full">
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            {[
              { value: record.turns, label: 'Turns' },
              { value: record.difficulty, label: 'Difficulty', capitalize: true },
              { value: `${stats.winRate}%`, label: 'Win rate' },
            ].map(item => (
              <div key={item.label} className={chrome.box}>
                <div className={`${chrome.boxValue} ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</div>
                <div className={chrome.boxLabel}>{item.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(record.finalStats).map(([key, value]) => (
              <div key={key} className={chrome.box}>
                <div className={`${chrome.boxValue} ${value <= 15 || value >= 85 ? '!text-[#ff5d5d]' : ''}`}>{value}</div>
                <div className={`${chrome.boxLabel} truncate`}>{reality.statNames[key as keyof typeof reality.statNames]}</div>
              </div>
            ))}
          </div>

          <div className={`space-x-4 ${chrome.meta}`}>
            <span>{stats.totalGames} games played</span>
            <span>{stats.wins} wins</span>
            {stats.currentStreak > 1 && <span>{stats.currentStreak} win streak</span>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {nextDeck ? (
          <button onClick={() => onPlayNext(nextDeck)} className={`transition-colors duration-300 ${chrome.primaryBtn}`}
                  title={`Continue the series: ${nextDeck.name}`}>
            {NEXT_LABEL[shellTheme]}
          </button>
        ) : (
          <button onClick={onPlayAgain} className={`transition-colors duration-300 ${chrome.primaryBtn}`}>
            {shellTheme === 'crt' ? 'CONTINUE?' : shellTheme === 'handheld' ? 'PLAY AGAIN' : 'Draw Again'}
          </button>
        )}
        <button onClick={onRestart} className={`transition-colors duration-300 ${chrome.secondaryBtn}`}>
          {MENU_LABEL[shellTheme]}
        </button>
        <button
          onClick={handleExportDeck}
          className={`flex items-center gap-2 transition-colors duration-300 ${chrome.secondaryBtn}`}
          title="Export the story you just played"
        >
          <ExportIcon />
          Export Story
        </button>
      </div>
      {nextDeck && (
        <p className={`mt-4 ${chrome.meta}`}>Next in the series: “{nextDeck.name}”</p>
      )}
    </div>
  );

  if (shellTheme === 'crt') return <div className="h-full w-full"><CrtShell>{content}</CrtShell></div>;
  if (shellTheme === 'handheld') return <div className="h-full w-full"><HandheldShell>{content}</HandheldShell></div>;
  return <div className={`h-full w-full ${reality.font}`}>{content}</div>;
};

export default GameOverScreen;
