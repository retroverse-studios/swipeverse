/**
 * PROTOTYPE — design-refresh direction mockups. THROWAWAY.
 *
 * Four radically different visual directions of the main menu + game screen,
 * switchable via ?variant= (A–D) and ?screen= (menu|game).
 * Mounted dev-only from index.tsx; never ships in production builds.
 *
 * Flip with ←/→ (variant) and ↑/↓ (screen), or the bottom bar.
 */
import React, { useEffect, useState } from 'react';
import { PrototypeScreen } from './mockData';
import CrtArcade from './CrtArcade';
import NeonTarot from './NeonTarot';
import HandheldConsole from './HandheldConsole';
import DisciplinedGlass from './DisciplinedGlass';

const VARIANTS = [
  { key: 'A', name: 'CRT Arcade', Component: CrtArcade },
  { key: 'B', name: 'Neon Tarot', Component: NeonTarot },
  { key: 'C', name: 'Handheld Console', Component: HandheldConsole },
  { key: 'D', name: 'Disciplined Glass', Component: DisciplinedGlass },
];

const FONTS = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Cinzel:wght@600;800&display=swap';

function readParams(): { variant: number; screen: PrototypeScreen } {
  const params = new URLSearchParams(window.location.search);
  const idx = VARIANTS.findIndex(v => v.key === (params.get('variant') || 'A').toUpperCase());
  return {
    variant: idx >= 0 ? idx : 0,
    screen: params.get('screen') === 'game' ? 'game' : 'menu',
  };
}

const DesignPrototype: React.FC = () => {
  const [{ variant, screen }, setState] = useState(readParams);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  const update = (nextVariant: number, nextScreen: PrototypeScreen) => {
    const wrapped = (nextVariant + VARIANTS.length) % VARIANTS.length;
    setState({ variant: wrapped, screen: nextScreen });
    const params = new URLSearchParams(window.location.search);
    params.set('variant', VARIANTS[wrapped].key);
    params.set('screen', nextScreen);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'ArrowLeft') update(variant - 1, screen);
      else if (e.key === 'ArrowRight') update(variant + 1, screen);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') update(variant, screen === 'menu' ? 'game' : 'menu');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [variant, screen]);

  const { Component, key, name } = VARIANTS[variant];

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Component screen={screen} />
      {/* Switcher bar — deliberately NOT part of the designs being judged */}
      <div style={{
        position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 10, background: '#fff', color: '#111',
        borderRadius: 999, padding: '8px 14px', boxShadow: '0 8px 30px rgba(0,0,0,.5)',
        fontFamily: 'system-ui, sans-serif', fontSize: 13, userSelect: 'none',
      }}>
        <button onClick={() => update(variant - 1, screen)} style={btn}>←</button>
        <span style={{ fontWeight: 700, minWidth: 150, textAlign: 'center' }}>{key} · {name}</span>
        <button onClick={() => update(variant + 1, screen)} style={btn}>→</button>
        <span style={{ width: 1, height: 18, background: '#ddd' }} />
        {(['menu', 'game'] as const).map(s => (
          <button key={s} onClick={() => update(variant, s)}
            style={{ ...btn, background: screen === s ? '#111' : 'transparent', color: screen === s ? '#fff' : '#111', padding: '4px 10px', borderRadius: 999 }}>
            {s === 'menu' ? 'Menu' : 'Game'}
          </button>
        ))}
      </div>
    </div>
  );
};

const btn: React.CSSProperties = {
  border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#111',
};

export default DesignPrototype;
