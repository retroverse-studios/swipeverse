import React, { useState, useEffect, useRef } from 'react';
import { CardData, Reality, Stats, StatName } from '../types';
import { FALLBACK_IMAGE_DATA_URL, cardBackFor, statBadgeFor, resolveAssetUrl } from '../constants';

interface CardProps {
  card: CardData;
  onSwipe: (direction: 'left' | 'right') => void;
  onDragPreview: (effects: Partial<Stats> | null) => void;
  isTop: boolean;
  reality: Reality;
}

/** The stat this card is mostly about — drives the wax-seal badge. */
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

const Card: React.FC<CardProps> = ({ card, onSwipe, onDragPreview, isTop, reality }) => {
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
      className="absolute w-full h-full rounded-2xl tarot-frame flex flex-col overflow-visible"
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
      <div className="relative bg-black/20 rounded-t-xl overflow-hidden mx-[7px] mt-[7px]" style={{ height: 'calc(50% - 7px)' }}>
        {currentImageSrc && (
            <img src={currentImageSrc} onError={handleImageError} alt={card.prompt} className="w-full h-full object-cover rounded-t-lg" draggable={false} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-tarot-velvet-2/80 to-transparent"></div>
        <div className="absolute top-4 left-4 right-4 text-center h-10 flex items-center justify-center">
            <p className="text-lg font-cinzel font-semibold transition-opacity duration-200 text-tarot-gold-bright p-2 rounded tarot-plaque"
               style={{ opacity: choiceOpacity, display: choiceText ? undefined : 'none' }}>
              {choiceText}
            </p>
        </div>
      </div>

      {/* Wax seal — the stat this dilemma is mostly about */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full tarot-seal flex items-center justify-center z-10 pointer-events-none">
        <img src={sealBadge} alt="" className="w-7 h-7 [image-rendering:pixelated] brightness-150 saturate-50" draggable={false} />
      </div>

      <div className="h-1/2 px-4 md:px-6 pt-7 pb-4 flex flex-col justify-between">
        <div className="flex-grow flex items-center justify-center">
            <p className="text-base md:text-xl text-center leading-relaxed text-tarot-paper">{card.prompt}</p>
        </div>

        <div className="flex justify-between gap-3 text-[0.68rem] text-tarot-muted mt-3">
            <span className="text-left w-2/5"><span className="text-tarot-gold">⇦</span> {card.leftChoice.text}</span>
            <span className="text-right w-2/5">{card.rightChoice.text} <span className="text-tarot-gold">⇨</span></span>
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
    return <div className="text-tarot-muted">Awaiting transmission from the multiverse...</div>;
  }

  return (
    <div className="relative w-11/12 h-[500px] max-w-md md:w-full md:max-w-lg">
      {/* The deck behind: card backs, not future card faces */}
      {remaining > 2 && (
        <div className="absolute w-full h-full rounded-2xl tarot-frame overflow-hidden" style={{ transform: 'scale(0.9) translateY(-20px)' }}>
          <img src={backUrl} alt="" className="w-full h-full object-cover opacity-80" draggable={false} />
        </div>
      )}
      {remaining > 1 && (
        <div className="absolute w-full h-full rounded-2xl tarot-frame overflow-hidden" style={{ transform: 'scale(0.95) translateY(-10px)' }}>
          <img src={backUrl} alt="" className="w-full h-full object-cover opacity-90" draggable={false} />
        </div>
      )}
      {/* Top card rises from the deck on every advance (keyed by card id) */}
      <div key={currentCard.id} className="absolute w-full h-full animate-tarot-rise" style={{ zIndex: 3 }}>
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
