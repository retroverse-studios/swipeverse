import React, { useState } from 'react';
import { Reality } from '../types';
import { Difficulty } from '../services/gameHistory';
import { AddIcon, EditIcon, StoreIcon } from './icons';

interface MainMenuProps {
  realities: Reality[];
  onStartGame: (reality: Reality, difficulty: Difficulty) => void;
  onGoToEditor: (reality: Reality | null) => void;
  onGoToStore: () => void;
  onOpenAISettings: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallClick: () => void;
}

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; desc: string; color: string }> = {
  easy: { label: 'Easy', desc: '0.7x effects', color: 'text-green-400 border-green-400' },
  standard: { label: 'Standard', desc: '1.0x effects', color: 'text-yellow-400 border-yellow-400' },
  hard: { label: 'Hard', desc: '1.3x effects', color: 'text-red-400 border-red-400' },
};

const MainMenu: React.FC<MainMenuProps> = ({
  realities,
  onStartGame,
  onGoToEditor,
  onGoToStore,
  onOpenAISettings,
  installPrompt,
  onInstallClick
}) => {
  const [selectedForPlay, setSelectedForPlay] = useState<Reality | null>(null);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-fade-in">
      <h1 className="text-6xl md:text-8xl font-bold font-orbitron mb-4 text-center tracking-widest text-shadow">
        SWIPEVERSE
      </h1>
      <p className="text-xl text-gray-300 mb-8 text-center max-w-2xl">
        Your decisions. Infinite realities. Swipe to shape destiny across the multiverse.
      </p>
      
      <div className="flex items-center space-x-4 mb-8">
        {installPrompt && (
            <button 
                onClick={onInstallClick}
                className="py-2 px-5 font-bold text-md rounded-md transition-colors duration-300 bg-cyber-pink/80 text-white border-2 border-cyber-pink hover:bg-cyber-pink"
                aria-label="Install app"
            >
                Install App
            </button>
        )}
        <button
            onClick={onGoToStore}
            className="flex items-center gap-2 py-2 px-5 font-bold text-md rounded-md transition-colors duration-300 bg-mystic-purple/80 text-white border-2 border-mystic-purple hover:bg-mystic-purple"
            aria-label="Go to community store"
        >
            <StoreIcon /> Community Store
        </button>
        <button
            onClick={onOpenAISettings}
            className="flex items-center gap-2 py-2 px-5 font-bold text-md rounded-md transition-colors duration-300 bg-gray-700/80 text-white border-2 border-gray-500 hover:bg-gray-600"
            aria-label="AI Settings"
        >
            AI Settings
        </button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {realities.map((reality) => (
          <div
            key={reality.id}
            className={`flex flex-col justify-between p-6 border-2 ${reality.colors.accent} bg-black/40 rounded-lg shadow-lg backdrop-blur-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${reality.font}`}
          >
            <div>
              <h2 className={`text-3xl font-bold ${reality.colors.secondary} mb-2`}>{reality.name}</h2>
              <p className="text-gray-300 mb-4 h-24 overflow-y-auto">{reality.description}</p>
              {(reality.deck && reality.deck.cards && reality.deck.cards.length > 0) && (
                <div className={`text-sm text-center mb-4 p-2 rounded-md border ${reality.colors.accent} bg-white/5`}>
                  <p className='font-bold text-white'>Custom Story Active</p>
                  <p className='text-gray-300 truncate'>{reality.deck.name || 'Untitled Story'}</p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 space-y-2">
              {selectedForPlay?.id === reality.id ? (
                <div className="flex gap-2">
                  {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d => (
                    <button key={d}
                      onClick={() => onStartGame(reality, d)}
                      className={`flex-1 py-2 px-2 text-sm font-bold rounded-md border-2 bg-transparent hover:bg-white/10 transition-colors ${DIFFICULTY_LABELS[d].color}`}
                    >
                      {DIFFICULTY_LABELS[d].label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedForPlay(reality)}
                    className={`w-full py-3 px-6 font-bold text-lg rounded-md transition-colors duration-300 ${reality.colors.primary} border-2 ${reality.colors.accent} bg-transparent hover:bg-white/10`}
                  >
                    Enter Reality
                  </button>
                  <button
                    onClick={() => onGoToEditor(reality)}
                    className="p-3 font-bold text-lg rounded-md transition-colors duration-300 text-gray-300 border-2 border-gray-600 bg-transparent hover:bg-white/10"
                    title="Edit this reality"
                  >
                    <EditIcon />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Create new reality card */}
        <div 
          onClick={() => onGoToEditor(null)}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 bg-black/20 rounded-lg shadow-lg backdrop-blur-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:border-white hover:bg-white/5"
        >
          <div className="text-gray-400 hover:text-white transition-colors">
            <AddIcon />
          </div>
          <p className="mt-2 text-xl font-bold text-gray-400 hover:text-white transition-colors">Create New Reality</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;