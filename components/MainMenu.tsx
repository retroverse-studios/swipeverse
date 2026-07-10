import React, { useState } from 'react';
import { Reality } from '../types';
import { Difficulty } from '../services/gameHistory';
import { AddIcon, EditIcon, StoreIcon } from './icons';
import { cardBackFor, resolveAssetUrl } from '../constants';

interface MainMenuProps {
  realities: Reality[];
  onStartGame: (reality: Reality, difficulty: Difficulty) => void;
  onGoToEditor: (reality: Reality | null) => void;
  onGoToStore: () => void;
  onOpenAISettings: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallClick: () => void;
}

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; desc: string }> = {
  easy: { label: 'Gentle Fates', desc: '0.7× effects' },
  standard: { label: 'True Reading', desc: '1.0× effects' },
  hard: { label: 'Cruel Stars', desc: '1.3× effects' },
};

// Slight alternating tilt gives the spread its hand-dealt look; straightens on hover.
const tiltFor = (index: number) => ['-rotate-3', 'rotate-0', 'rotate-3'][index % 3];

const MainMenu: React.FC<MainMenuProps> = ({
  realities,
  onStartGame,
  onGoToEditor,
  onGoToStore,
  onOpenAISettings,
  installPrompt,
  onInstallClick,
}) => {
  const [selectedForPlay, setSelectedForPlay] = useState<Reality | null>(null);

  return (
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
              </div>

              {isSelected && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-56 z-30 animate-fade-in">
                  <p className="text-center text-tarot-muted text-[0.6rem] uppercase tracking-[0.25em] mb-2">Choose your reading</p>
                  <div className="flex flex-col gap-1.5">
                    {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d => (
                      <button
                        key={d}
                        onClick={() => onStartGame(reality, d)}
                        className="tarot-plaque rounded-lg py-2 px-3 text-sm font-cinzel font-semibold tracking-wide transition-colors"
                      >
                        {DIFFICULTY_LABELS[d].label}
                        <span className="block text-[0.62rem] text-tarot-muted font-exo font-normal">{DIFFICULTY_LABELS[d].desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Spacer so the difficulty panel doesn't overlap the row below */}
              {isSelected && <div className="h-44" />}
            </div>
          );
        })}

        {/* Create new reality — the blank card in the deck */}
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
        <button onClick={onOpenAISettings} className="text-tarot-muted hover:text-tarot-gold-bright transition-colors" aria-label="AI Settings">
          AI Settings
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
