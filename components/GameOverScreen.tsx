import React from 'react';
import { Reality, CardData, Deck } from '../types';
import { GameSummary } from '../services/gameHistory';
import { ExportIcon } from './icons';

interface GameOverScreenProps {
  reason: string;
  reality: Reality;
  onRestart: () => void;
  deck: CardData[];
  summary: GameSummary | null;
  addToast: (message: string, type: 'success' | 'error') => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ reason, reality, onRestart, deck, summary, addToast }) => {

  const handleExportDeck = () => {
    if (!deck || deck.length === 0) {
      addToast("No story deck to export.", 'error');
      return;
    }
    const deckToExport: Deck = {
        name: reality.deck?.name || "Exported Story",
        description: reality.deck?.description || `A story played in the ${reality.name} reality.`,
        cards: deck.map(({ prompt, imageUrl, leftChoice, rightChoice }) => ({
            prompt, imageUrl, leftChoice, rightChoice
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

  return (
    <div className={`flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in ${reality.font}`}>
      <h1 className={`text-7xl font-bold mb-4 ${record?.won ? reality.colors.secondary : reality.colors.primary}`}>
        {record?.won ? 'Victory' : 'Game Over'}
      </h1>
      <p className="text-2xl text-gray-200 mb-6 max-w-xl">{reason}</p>

      {/* Game Summary */}
      {record && stats && (
        <div className="mb-8 max-w-md w-full">
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{record.turns}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Turns</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-white capitalize">{record.difficulty}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Difficulty</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{stats.winRate}%</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Win Rate</div>
            </div>
          </div>

          {/* Final Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(record.finalStats).map(([key, value]) => (
              <div key={key} className="bg-black/20 rounded p-2 text-center">
                <div className={`text-lg font-bold ${value <= 10 || value >= 90 ? 'text-red-400' : 'text-white'}`}>{value}</div>
                <div className="text-xs text-gray-500 truncate">{reality.statNames[key as keyof typeof reality.statNames]}</div>
              </div>
            ))}
          </div>

          {/* Overall Stats */}
          <div className="text-sm text-gray-400 space-x-4">
            <span>{stats.totalGames} games played</span>
            <span>{stats.wins} wins</span>
            {stats.currentStreak > 1 && <span className="text-yellow-400">{stats.currentStreak} win streak</span>}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={onRestart}
          className={`py-3 px-8 text-xl font-bold rounded-lg transition-colors duration-300 ${reality.colors.secondary} border-2 ${reality.colors.accent} bg-transparent hover:bg-white/10`}
        >
          Return to the Void
        </button>
        <button
          onClick={handleExportDeck}
          className="flex items-center gap-2 py-3 px-6 text-xl font-bold rounded-lg transition-colors duration-300 text-gray-300 border-2 border-gray-600 bg-transparent hover:bg-white/10"
          title="Export the story you just played"
        >
          <ExportIcon />
          Export Story
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
