import React, { useState, useEffect, useRef } from 'react';
import { CardData, Reality, Stats, StatName } from '../types';
import { FALLBACK_IMAGE_DATA_URL, cardBackFor, statBadgeFor, resolveAssetUrl } from '../constants';
import { useShellTheme } from './ShellThemeContext';
import { ShellThemeId } from '../services/shellTheme';

interface CardProps {
  card: CardData;
  onSwipe: (direction: 'left' | 'right') => void;
  onDragPreview: (effects: Partial<Stats> | null) => void;
  isTop: boolean;
  reality: Reality;
}

/** The stat this card is mostly about — drives the seal/badge. */
function dominantStat(card: CardData): StatName {
  const stats: StatName[] = ['Power', 'Wealth', 'People', 'Knowledge'];
  let best: StatName = 'Power';
  let bestWeight = -1;
  for (const stat of stats) {
    const weight = Math.abs(card.leftChoice.effects[stat] || 0) + Math.abs(card.rightChoice.effects[stat] || 0);
    if (weight > bestWeight) { best = stat; bestWeight = weight; }
  }
  return best;
}

/** Per-shell card chrome. */
const CHROME: Record<ShellThemeId, {
  frame: string;
  artInset: boolean;
  prompt: string;
  hintAccent: string;
  hintText: string;
  overlay: string;
  rise: string;
}> = {
  tarot: {
    frame: 'rounded-2xl tarot-frame',
    artInset: true,
    prompt: 'text-tarot-paper',
    hintAccent: 'text-tarot-gold',
    hintText: 'text-tarot-muted',
    overlay: 'font-cinzel font-semibold text-tarot-gold-bright tarot-plaque rounded',
    rise: 'animate-tarot-rise',
  },
  crt: {
    frame: 'bg-[#0d1120] border-[3px] border-cyber-pink shadow-[0_0_0_3px_#090b14,0_0_24px_rgba(255,82,225,.35)]',
    artInset: false,
    prompt: 'font-vt text-[#dfe6f5] !text-xl md:!text-2xl !leading-snug',
    hintAccent: 'text-[#7fe7f5]',
    hintText: 'text-[#7fe7f5]',
    overlay: 'font-vt text-white bg-black/70 border border-[#7fe7f5] rounded-none !text-xl',
    rise: 'animate-crt-in',
  },
  handheld: {
    frame: 'rounded bg-[#16241b] border-2 border-[#a3ffbe]/25',
    artInset: false,
    prompt: 'font-vt text-[#cfe8d5] !text-lg md:!text-xl !leading-snug',
    hintAccent: 'text-[#a3ffbe]',
    hintText: 'text-[#5c8a6b]',
    overlay: 'font-vt text-[#a3ffbe] bg-[#0f1a14]/90 border border-[#a3ffbe]/40 rounded-none !text-lg',
    rise: 'animate-hh-in',
  },
};

const Card: React.FC<CardProps> = ({ card, onSwipe, onDragPreview, isTop, reality }) => {
  const { shellTheme } = useShellTheme();
  const chrome = CHROME[shellTheme];
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [choiceText, setChoiceText] = useState<string | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState(card.imageUrl);
  const lastPreviewSide = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    setCurrentImageSrc(card.imageUrl);
  }, [card.id, card.imageUrl]);

  const handleImageError = () => {
    setCurrentImageSrc(FALLBACK_IMAGE_DATA_URL);
  };

  const swipeThreshold = 100;

  const sendPreview = (side: 'left' | 'right' | null) => {
    if (side === lastPreviewSide.current) return;
    lastPreviewSide.current = side;
    onDragPreview(side ? card[side === 'left' ? 'leftChoice' : 'rightChoice'].effects : null);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isTop) return;
    const point = 'touches' in e ? e.touches[0] : e;
    setDragStart({ x: point.clientX, y: point.clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !isTop || !dragStart) return;
    const point = 'touches' in e ? e.touches[0] : e;
    const deltaX = point.clientX - dragStart.x;

    setDragPos({ x: deltaX, y: 0 });

    if (deltaX > 20) {
      setChoiceText(card.rightChoice.text);
      sendPreview('right');
    } else if (deltaX < -20) {
      setChoiceText(card.leftChoice.text);
      sendPreview('left');
    } else {
      setChoiceText(null);
      sendPreview(null);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);
    sendPreview(null);

    if (dragPos.x > swipeThreshold) {
      onSwipe('right');
    } else if (dragPos.x < -swipeThreshold) {
      onSwipe('left');
    }

    setDragPos({ x: 0, y: 0 });
    setDragStart(null);
    setChoiceText(null);
  };

  const rotation = dragPos.x / 20;
  const transform = `translateX(${dragPos.x}px) rotate(${rotation}deg)`;
  const transitionStyle = isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';

  const choiceOpacity = Math.min(Math.abs(dragPos.x) / swipeThreshold, 1);
  const sealBadge = resolveAssetUrl(statBadgeFor(dominantStat(card), reality.id));

  return (
    <div
      className={`absolute w-full h-full flex flex-col ${chrome.frame}`}
      style={{
        transform,
        transition: transitionStyle,
        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: isTop ? 'none' : 'auto'
       }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      <div
        className={`relative bg-black/20 overflow-hidden ${chrome.artInset ? 'rounded-t-xl mx-[7px] mt-[7px]' : ''}`}
        style={{ height: chrome.artInset ? 'calc(50% - 7px)' : '50%' }}
      >
        {currentImageSrc && (
            <img src={currentImageSrc} onError={handleImageError} alt={card.prompt} className="w-full h-full object-cover" draggable={false} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 left-4 right-4 text-center h-10 flex items-center justify-center">
            <p className={`text-lg transition-opacity duration-200 p-2 ${chrome.overlay}`}
               style={{ opacity: choiceOpacity, display: choiceText ? undefined : 'none' }}>
              {choiceText}
            </p>
        </div>
      </div>

      {/* Dominant-stat marker: wax seal (tarot) or corner badge (crt/handheld) */}
      {shellTheme === 'tarot' ? (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full tarot-seal flex items-center justify-center z-10 pointer-events-none">
          <img src={sealBadge} alt="" className="w-7 h-7 [image-rendering:pixelated] brightness-150 saturate-50" draggable={false} />
        </div>
      ) : (
        <div className={`absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center z-10 pointer-events-none ${shellTheme === 'crt' ? 'bg-[#090b14] border-2 border-[#7fe7f5] rounded' : 'bg-[#0f1a14] border border-[#a3ffbe]/50 rounded'}`}>
          <img src={sealBadge} alt="" className="w-6 h-6 [image-rendering:pixelated]" draggable={false} />
        </div>
      )}

      <div className="h-1/2 px-4 md:px-6 pt-7 pb-4 flex flex-col justify-between">
        <div className="flex-grow flex items-center justify-center">
            <p className={`text-base md:text-xl text-center leading-relaxed ${chrome.prompt}`}>{card.prompt}</p>
        </div>

        <div className={`flex justify-between gap-3 text-[0.68rem] mt-3 ${chrome.hintText}`}>
            <span className="text-left w-2/5"><span className={chrome.hintAccent}>⇦</span> {card.leftChoice.text}</span>
            <span className="text-right w-2/5">{card.rightChoice.text} <span className={chrome.hintAccent}>⇨</span></span>
        </div>
      </div>
    </div>
  );
};

interface CardStackProps {
  cards: CardData[];
  currentIndex: number;
  onSwipe: (card: CardData, direction: 'left' | 'right') => void;
  onDragPreview: (effects: Partial<Stats> | null) => void;
  reality: Reality;
}

const CardStack: React.FC<CardStackProps> = ({ cards, currentIndex, onSwipe, onDragPreview, reality }) => {
  const { shellTheme } = useShellTheme();
  const chrome = CHROME[shellTheme];

  const handleSwipe = (direction: 'left' | 'right') => {
    const swipedCard = cards[currentIndex];
    if (swipedCard) {
        onSwipe(swipedCard, direction);
    }
  };

  const currentCard = cards[currentIndex];
  const remaining = cards.length - currentIndex;
  const backUrl = resolveAssetUrl(cardBackFor(reality.id));

  if (!currentCard) {
    return <div className="text-gray-400">Awaiting transmission from the multiverse...</div>;
  }

  return (
    <div className="relative w-11/12 h-[440px] md:h-[500px] max-w-md md:w-full md:max-w-lg">
      {/* The deck behind: card backs, not future card faces */}
      {remaining > 2 && (
        <div className={`absolute w-full h-full overflow-hidden ${chrome.frame}`} style={{ transform: 'scale(0.9) translateY(-20px)' }}>
          <img src={backUrl} alt="" className="w-full h-full object-cover opacity-80" draggable={false} />
        </div>
      )}
      {remaining > 1 && (
        <div className={`absolute w-full h-full overflow-hidden ${chrome.frame}`} style={{ transform: 'scale(0.95) translateY(-10px)' }}>
          <img src={backUrl} alt="" className="w-full h-full object-cover opacity-90" draggable={false} />
        </div>
      )}
      {/* Top card enters per the shell's deal animation (keyed by card id) */}
      <div key={currentCard.id} className={`absolute w-full h-full ${chrome.rise}`} style={{ zIndex: 3 }}>
        <Card
          card={currentCard}
          onSwipe={handleSwipe}
          onDragPreview={onDragPreview}
          isTop={true}
          reality={reality}
        />
      </div>
    </div>
  );
};

export default CardStack;
