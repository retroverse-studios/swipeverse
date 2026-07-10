import React from 'react';
import { useShellTheme } from './ShellThemeContext';

interface StatMeterProps {
  name: string;
  value: number;
  badgeUrl: string;
  /**
   * Drag stat-preview (0..1): how strongly the currently dragged choice would
   * touch this stat. Direction and exact magnitude stay hidden — the glow just
   * says "this one moves". null = not dragging / untouched.
   */
  preview: number | null;
}

const DANGER_LOW = 15;
const DANGER_HIGH = 85;

/** Tarot: badge in a conic-gradient orb with a value chip. */
const TarotOrb: React.FC<StatMeterProps & { danger: boolean; clamped: number }> = ({ name, badgeUrl, preview, danger, clamped }) => {
  const ringColor = danger ? 'var(--tarot-danger)' : 'var(--tarot-gold)';
  const previewGlow = preview
    ? { boxShadow: `0 0 ${10 + preview * 26}px rgba(246,228,168,${0.35 + preview * 0.55})` }
    : undefined;
  return (
    <div className="flex flex-col items-center w-16 md:w-20 select-none">
      <div
        className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-shadow duration-150 ${danger ? 'animate-orb-danger' : ''}`}
        style={{
          background: `conic-gradient(${ringColor} ${clamped}%, rgba(255,255,255,0.07) 0)`,
          boxShadow: `0 0 14px ${danger ? 'rgba(255,93,93,0.45)' : 'rgba(201,150,46,0.35)'}`,
          ...previewGlow,
        }}
      >
        <div className="absolute inset-[4px] rounded-full bg-tarot-velvet" />
        <img src={badgeUrl} alt={name} className="relative w-6 h-6 md:w-9 md:h-9 [image-rendering:pixelated]" />
        <span className={`absolute -bottom-1 -right-1 text-[0.6rem] md:text-[0.68rem] font-exo px-1.5 py-px rounded-full bg-tarot-velvet border ${danger ? 'border-[var(--tarot-danger)] text-[var(--tarot-danger)]' : 'border-tarot-gold text-tarot-paper'}`}>
          {clamped}
        </span>
      </div>
      <span className="mt-2 text-[0.55rem] md:text-[0.62rem] uppercase tracking-[0.18em] text-tarot-muted text-center leading-tight">
        {name}
      </span>
    </div>
  );
};

/** CRT: label + segmented phosphor blocks. */
const CrtBlocks: React.FC<StatMeterProps & { danger: boolean; clamped: number }> = ({ name, badgeUrl, preview, danger, clamped }) => {
  const lit = Math.round(clamped / 10);
  const on = danger ? 'bg-[#ff5d5d] shadow-[0_0_8px_rgba(255,93,93,.9)]' : 'bg-cyber-pink shadow-[0_0_6px_rgba(255,82,225,.8)]';
  return (
    <div className="flex-1 min-w-0 select-none" style={preview ? { filter: `drop-shadow(0 0 ${4 + preview * 10}px rgba(255,255,255,.9))` } : undefined}>
      <div className={`flex justify-between items-center text-[0.85rem] md:text-base tracking-[0.12em] ${danger ? 'text-[#ff5d5d]' : 'text-[#7fe7f5]'}`}>
        <span className="flex items-center gap-1 truncate">
          <img src={badgeUrl} alt="" className="w-4 h-4 [image-rendering:pixelated]" />
          <span className="truncate">{name.toUpperCase()}</span>
        </span>
        <span>{clamped}</span>
      </div>
      <div className="flex gap-[3px] mt-1">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={`flex-1 h-2.5 outline outline-1 outline-white/5 ${i < lit ? `${on} ${danger ? 'animate-blink-fast' : ''}` : 'bg-[#1b2233]'}`} />
        ))}
      </div>
    </div>
  );
};

/** Handheld: badge + chunky LCD cells. */
const HandheldCells: React.FC<StatMeterProps & { danger: boolean; clamped: number }> = ({ name, badgeUrl, preview, danger, clamped }) => {
  const lit = Math.round(clamped / 12.5);
  return (
    <div className="flex items-center gap-1.5 select-none" title={`${name}: ${clamped}`}
         style={preview ? { filter: `drop-shadow(0 0 ${3 + preview * 8}px rgba(163,255,190,.95))` } : undefined}>
      <img src={badgeUrl} alt={name} className="w-5 h-5 [image-rendering:pixelated]" />
      <div className="flex gap-[2px]">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} className={`w-2 h-2 ${i < lit ? (danger ? 'bg-[#ff8f6b] animate-blink-fast' : 'bg-[#a3ffbe]') : 'bg-[#1d2c22]'}`} />
        ))}
      </div>
    </div>
  );
};

const StatBar: React.FC<StatMeterProps> = (props) => {
  const { shellTheme } = useShellTheme();
  const clamped = Math.max(0, Math.min(100, props.value));
  const danger = clamped <= DANGER_LOW || clamped >= DANGER_HIGH;

  if (shellTheme === 'crt') return <CrtBlocks {...props} danger={danger} clamped={clamped} />;
  if (shellTheme === 'handheld') return <HandheldCells {...props} danger={danger} clamped={clamped} />;
  return <TarotOrb {...props} danger={danger} clamped={clamped} />;
};

export default StatBar;
