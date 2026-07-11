import React, { useState, useEffect } from 'react';
import { Reality } from '../types';
import { Difficulty } from '../services/gameHistory';
import { deckSurvival } from '../services/deckSolver';
import { AddIcon, EditIcon, StoreIcon } from './icons';
import { cardBackFor, pickCardArt, resolveAssetUrl } from '../constants';
import { useShellTheme } from './ShellThemeContext';
import { CrtShell, HandheldShell } from './shells';

interface MainMenuProps {
  realities: Reality[];
  onStartGame: (reality: Reality, difficulty: Difficulty) => void;
  onGoToEditor: (reality: Reality | null) => void;
  onGoToStore: () => void;
  onOpenAISettings: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallClick: () => void;
}

interface MenuLayoutProps extends MainMenuProps {
  selectedForPlay: Reality | null;
  setSelectedForPlay: (reality: Reality | null) => void;
  /** Random-play survival per difficulty — only for realities with a fixed deck. */
  survival: Record<Difficulty, number> | null;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'standard', 'hard'];

const survivalHint = (survival: Record<Difficulty, number> | null, difficulty: Difficulty): string | null => {
  if (!survival) return null;
  const pct = survival[difficulty] * 100;
  // Never display 0%: sub-1% decks are brutal, not unwinnable (the generator
  // guarantees winnability), and rounding to zero reads as "impossible".
  if (pct < 1) return '<1% survive';
  return `~${Math.round(pct)}% survive`;
};

/* ── Neon Tarot ─────────────────────────────────────────────────────── */

const TAROT_DIFFICULTY: Record<Difficulty, { label: string; desc: string }> = {
  easy: { label: 'Gentle Fates', desc: '0.7× effects' },
  standard: { label: 'True Reading', desc: '1.0× effects' },
  hard: { label: 'Cruel Stars', desc: '1.3× effects' },
};

const tiltFor = (index: number) => ['-rotate-3', 'rotate-0', 'rotate-3'][index % 3];

const TarotMenu: React.FC<MenuLayoutProps> = ({
  realities, onStartGame, onGoToEditor, onGoToStore, onOpenAISettings,
  installPrompt, onInstallClick, selectedForPlay, setSelectedForPlay, survival,
}) => (
  <div className="flex flex-col items-center min-h-full p-4 pt-10 md:pt-16 animate-fade-in overflow-y-auto h-full">
    <h1 className="font-cinzel font-extrabold tracking-[0.14em] text-4xl md:text-6xl text-gold-gradient text-center">
      SWIPEVERSE
    </h1>
    <p className="text-tarot-muted uppercase tracking-[0.3em] text-xs md:text-sm mt-3 mb-10 text-center">
      The fate of realities, dealt one card at a time
    </p>

    <div className="flex flex-wrap items-start justify-center gap-6 md:gap-2 w-full max-w-5xl">
      {realities.map((reality, index) => {
        const isSelected = selectedForPlay?.id === reality.id;
        return (
          <div
            key={reality.id}
            className={`group relative w-52 md:w-56 md:-mx-3 ${tiltFor(index)} ${isSelected ? '!rotate-0 z-20 -translate-y-4' : 'hover:rotate-0 hover:-translate-y-4 hover:z-10'} transition-all duration-300`}
          >
            <div
              onClick={() => setSelectedForPlay(isSelected ? null : reality)}
              className="relative aspect-[3/4.6] rounded-2xl tarot-frame overflow-hidden cursor-pointer group-hover:shadow-[0_0_34px_rgba(201,150,46,0.45)] transition-shadow duration-300"
              role="button"
              aria-label={`Enter ${reality.name}`}
            >
              <img
                src={resolveAssetUrl(cardBackFor(reality.id))}
                alt=""
                className="absolute inset-[10px] w-[calc(100%-20px)] h-[calc(100%-20px)] object-cover rounded-lg opacity-90"
              />
              <div className="absolute left-[10px] right-[10px] bottom-[10px] rounded-b-lg bg-gradient-to-t from-tarot-velvet via-tarot-velvet/90 to-transparent pt-8 pb-3 px-2 text-center">
                <p className={`font-cinzel font-bold text-sm tracking-wide ${reality.colors.secondary}`}>{reality.name}</p>
                <p className="text-tarot-muted text-[0.65rem] leading-snug mt-1 line-clamp-2">{reality.description}</p>
                {reality.deck && reality.deck.cards && reality.deck.cards.length > 0 && (
                  <p className="text-tarot-gold-bright text-[0.6rem] mt-1 truncate" title={reality.deck.name}>
                    ✦ {reality.deck.name || 'Custom story'}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onGoToEditor(reality); }}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-tarot-velvet/70 text-tarot-muted hover:text-tarot-gold-bright opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit this reality"
              >
                <EditIcon />
              </button>

              {/* Difficulty appears ON the card face — no layout shift, works at any viewport */}
              {isSelected && (
                <div className="absolute inset-[10px] rounded-lg bg-tarot-velvet/90 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-2 px-3 animate-fade-in">
                  <p className={`font-cinzel font-bold text-sm tracking-wide text-center ${reality.colors.secondary}`}>{reality.name}</p>
                  <p className="text-tarot-muted text-[0.58rem] uppercase tracking-[0.25em] mb-1">Choose your reading</p>
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={(e) => { e.stopPropagation(); onStartGame(reality, d); }}
                      className="tarot-plaque rounded-lg py-1.5 px-3 w-full text-sm font-cinzel font-semibold tracking-wide transition-colors"
                    >
                      {TAROT_DIFFICULTY[d].label}
                      <span className="block text-[0.6rem] text-tarot-muted font-exo font-normal">
                        {TAROT_DIFFICULTY[d].desc}{survivalHint(survival, d) ? ` · ${survivalHint(survival, d)}` : ''}
                      </span>
                    </button>
                  ))}
                  <p className="text-tarot-muted/70 text-[0.55rem] mt-1">tap the card to close</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div
        onClick={() => onGoToEditor(null)}
        className={`w-52 md:w-56 md:-mx-3 ${tiltFor(realities.length)} hover:rotate-0 hover:-translate-y-4 hover:z-10 transition-all duration-300 cursor-pointer`}
      >
        <div className="aspect-[3/4.6] rounded-2xl border-2 border-dashed border-tarot-gold/40 bg-tarot-velvet-2/60 flex flex-col items-center justify-center text-tarot-muted hover:text-tarot-gold-bright hover:border-tarot-gold transition-colors">
          <AddIcon />
          <p className="font-cinzel font-semibold mt-2 text-sm">Blank Card</p>
          <p className="text-[0.65rem] mt-1">Create a new reality</p>
        </div>
      </div>
    </div>

    <div className="mt-12 mb-6 flex items-center gap-6 text-xs uppercase tracking-[0.25em]">
      {installPrompt && (
        <button onClick={onInstallClick} className="text-tarot-gold-bright hover:text-white transition-colors font-semibold" aria-label="Install app">
          ✦ Install App
        </button>
      )}
      <button onClick={onGoToStore} className="flex items-center gap-2 text-tarot-muted hover:text-tarot-gold-bright transition-colors" aria-label="Go to community store">
        <StoreIcon /> Store
      </button>
      <button onClick={onOpenAISettings} className="text-tarot-muted hover:text-tarot-gold-bright transition-colors" aria-label="Settings">
        Settings
      </button>
    </div>
  </div>
);

/* ── CRT Arcade ─────────────────────────────────────────────────────── */

const CRT_DIFFICULTY: Record<Difficulty, string> = { easy: 'EASY', standard: 'NORMAL', hard: 'HARD' };

const CrtMenu: React.FC<MenuLayoutProps> = ({
  realities, onStartGame, onGoToEditor, onGoToStore, onOpenAISettings,
  installPrompt, onInstallClick, selectedForPlay, setSelectedForPlay, survival,
}) => (
  <CrtShell>
    <div className="px-6 py-8 md:px-10 md:py-10 min-h-full flex flex-col">
      <h1 className="font-pixel text-cyber-pink crt-glow-pink text-center text-xl md:text-3xl tracking-wide">SWIPEVERSE</h1>
      <p className="text-[#7fe7f5] text-center text-lg md:text-xl tracking-[0.2em] mt-3">
        <span className="animate-blink">▮</span> INSERT COIN · SELECT REALITY
      </p>

      <div className="flex flex-col gap-1 max-w-xl w-full mx-auto mt-8 flex-grow">
        {realities.map(reality => {
          const isSelected = selectedForPlay?.id === reality.id;
          return (
            <div key={reality.id}>
              <div
                onClick={() => setSelectedForPlay(isSelected ? null : reality)}
                className={`flex items-baseline gap-3 text-xl md:text-2xl px-3 py-1.5 cursor-pointer ${isSelected ? 'text-white bg-cyber-pink/10 outline outline-1 outline-cyber-pink/50' : 'text-[#aab3c7] hover:text-white'}`}
              >
                <span className={`w-5 ${isSelected ? 'text-cyber-pink animate-blink' : 'text-transparent'}`}>▶</span>
                <span className="whitespace-nowrap">{reality.name.toUpperCase()}</span>
                <small className="text-[#5f6a80] text-sm truncate hidden md:inline">{reality.description}</small>
                <button
                  onClick={(e) => { e.stopPropagation(); onGoToEditor(reality); }}
                  className="ml-auto text-[#5f6a80] hover:text-[#7fe7f5] text-sm"
                  title="Edit this reality"
                >
                  [EDIT]
                </button>
              </div>
              {isSelected && (
                <div className="flex gap-2 pl-11 py-2 animate-fade-in">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => onStartGame(reality, d)}
                      className="font-pixel text-[9px] md:text-[10px] px-3 py-2 border border-[#7fe7f5] text-[#7fe7f5] hover:bg-[#7fe7f5]/10 hover:text-white"
                    >
                      {CRT_DIFFICULTY[d]}
                      {survivalHint(survival, d) && (
                        <span className="block font-vt text-sm text-[#5f6a80] mt-1 normal-case">{survivalHint(survival, d)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div
          onClick={() => onGoToEditor(null)}
          className="flex items-baseline gap-3 text-xl md:text-2xl px-3 py-1.5 cursor-pointer text-[#5f6a80] hover:text-white"
        >
          <span className="w-5 text-transparent">▶</span>
          <span>+ NEW REALITY</span>
        </div>
      </div>

      <div className="flex justify-center gap-8 text-[#5f6a80] text-base md:text-lg tracking-[0.2em] pb-2 pt-8">
        {installPrompt && <button onClick={onInstallClick} className="hover:text-cyber-pink">INSTALL</button>}
        <button onClick={onGoToStore} className="hover:text-[#7fe7f5]">STORE</button>
        <button onClick={onOpenAISettings} className="hover:text-[#7fe7f5]">SETTINGS</button>
      </div>
    </div>
  </CrtShell>
);

/* ── Handheld ───────────────────────────────────────────────────────── */

const HandheldMenu: React.FC<MenuLayoutProps> = ({
  realities, onStartGame, onGoToEditor, onGoToStore, onOpenAISettings,
  installPrompt, onInstallClick, selectedForPlay, setSelectedForPlay, survival,
}) => (
  <HandheldShell>
    <div className="p-3 min-h-full flex flex-col">
      <h1 className="font-pixel hh-green text-[10px] md:text-xs text-center tracking-[0.12em] pt-2 pb-3">SELECT CARTRIDGE</h1>
      <div className="flex flex-col gap-2.5 flex-grow">
        {realities.map(reality => {
          const isSelected = selectedForPlay?.id === reality.id;
          return (
            <div key={reality.id}>
              <div
                onClick={() => setSelectedForPlay(isSelected ? null : reality)}
                className={`relative bg-[#23305c] rounded-t-md rounded-b-sm px-2 pt-2 pb-2.5 border-t-4 border-[#16204a] cursor-pointer transition-transform ${isSelected ? '-translate-y-0.5 outline outline-1 outline-[#a3ffbe]/60' : 'hover:-translate-y-0.5'}`}
              >
                <div className="flex gap-2.5 items-center bg-[#d8d3c0] rounded-sm p-1.5">
                  <img src={resolveAssetUrl(pickCardArt('crisis', reality.id))} alt="" className="w-16 h-10 object-cover rounded-sm [image-rendering:pixelated]" />
                  <span className="min-w-0">
                    <b className="font-pixel text-[8px] text-[#23305c] block leading-relaxed truncate">{reality.name.toUpperCase()}</b>
                    <small className="font-vt text-sm text-[#6b6552] leading-none block truncate">{reality.description}</small>
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onGoToEditor(reality); }}
                    className="ml-auto text-[#6b6552] hover:text-[#23305c] font-vt text-sm shrink-0"
                    title="Edit this reality"
                  >
                    EDIT
                  </button>
                </div>
              </div>
              {isSelected && (
                <div className="flex gap-1.5 justify-center py-2 animate-fade-in font-vt">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => onStartGame(reality, d)}
                      className="text-[#a3ffbe] border border-[#a3ffbe]/50 px-3 py-1 text-base hover:bg-[#a3ffbe]/10"
                    >
                      {CRT_DIFFICULTY[d]}
                      {survivalHint(survival, d) && (
                        <span className="block text-xs text-[#5c8a6b]">{survivalHint(survival, d)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div
          onClick={() => onGoToEditor(null)}
          className="border border-dashed border-[#a3ffbe]/30 rounded px-2 py-2.5 text-center font-vt text-[#5c8a6b] hover:text-[#a3ffbe] cursor-pointer text-base"
        >
          + BLANK CARTRIDGE
        </div>
      </div>
      <div className="flex justify-center gap-5 font-vt text-[#5c8a6b] text-base pt-3 pb-1">
        {installPrompt && <button onClick={onInstallClick} className="hover:text-[#a3ffbe]">INSTALL</button>}
        <button onClick={onGoToStore} className="hover:text-[#a3ffbe]">STORE</button>
        <button onClick={onOpenAISettings} className="hover:text-[#a3ffbe]">SETTINGS</button>
      </div>
    </div>
  </HandheldShell>
);

/* ── Switch ─────────────────────────────────────────────────────────── */

const MainMenu: React.FC<MainMenuProps> = (props) => {
  const { shellTheme } = useShellTheme();
  const [selectedForPlay, setSelectedForPlay] = useState<Reality | null>(null);
  const [survival, setSurvival] = useState<Record<Difficulty, number> | null>(null);

  // Survival hints only make sense for a fixed deck (bundled or imported) —
  // AI-generated realities have no deck to analyze until play begins.
  // Deferred a tick so the selection UI paints before the solver runs.
  useEffect(() => {
    setSurvival(null);
    const deck = selectedForPlay?.deck;
    if (!deck || !deck.cards || deck.cards.length === 0) return;
    const timer = setTimeout(() => setSurvival(deckSurvival(deck)), 30);
    return () => clearTimeout(timer);
  }, [selectedForPlay]);

  const layoutProps: MenuLayoutProps = { ...props, selectedForPlay, setSelectedForPlay, survival };

  if (shellTheme === 'crt') return <CrtMenu {...layoutProps} />;
  if (shellTheme === 'handheld') return <HandheldMenu {...layoutProps} />;
  return <TarotMenu {...layoutProps} />;
};

export default MainMenu;
