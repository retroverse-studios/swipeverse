/** PROTOTYPE variant D — Disciplined Glass. Throwaway. */
import React from 'react';
import { MOCK_REALITIES, MOCK_CARD, MOCK_STATS, NODE_LABEL, isDanger, VariantProps } from './mockData';

const CSS = `
.dg-root { min-height: 100vh; background: radial-gradient(110% 80% at 75% -10%, rgba(255,82,225,.14), transparent 55%), linear-gradient(165deg, #10131f, #0a0c15 70%, #06070d); color: #e5e7eb; font-family: 'Exo 2', sans-serif; padding: 3.2rem 1.6rem 5rem; }
.dg-wrap { max-width: 980px; margin: 0 auto; }
.dg-hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 2.4rem; align-items: center; }
@media (max-width: 760px) { .dg-hero { grid-template-columns: 1fr; } }
.dg-eyebrow { color: #22d3ee; font-size: .72rem; letter-spacing: .3em; text-transform: uppercase; font-weight: 600; }
.dg-h1 { font-family: 'Orbitron', sans-serif; font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 900; line-height: 1.16; margin-top: .7rem; }
.dg-h1 em { color: #ff52e1; font-style: normal; }
.dg-lead { color: #9ca3af; margin-top: .9rem; max-width: 40ch; }
.dg-cta { display: inline-block; margin-top: 1.6rem; background: #ff52e1; color: #16030f; font-weight: 700; border-radius: 12px; padding: .8rem 1.6rem; box-shadow: 0 8px 30px rgba(255,82,225,.35); cursor: pointer; }
.dg-ghost { display: inline-block; margin: 1.6rem 0 0 .8rem; border: 1px solid rgba(255,255,255,.14); color: #e5e7eb; border-radius: 12px; padding: .8rem 1.3rem; cursor: pointer; }
.dg-feature { border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); backdrop-filter: blur(10px); }
.dg-feature img { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block; }
.dg-feature .cap { padding: .9rem 1.1rem; display: flex; justify-content: space-between; align-items: baseline; }
.dg-feature .cap b { font-family: 'Orbitron', sans-serif; font-size: .92rem; }
.dg-feature .cap span { color: #6b7280; font-size: .74rem; letter-spacing: .12em; text-transform: uppercase; }
.dg-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: .9rem; margin-top: 2.6rem; }
@media (max-width: 760px) { .dg-row { grid-template-columns: 1fr; } }
.dg-tile { display: flex; gap: .8rem; align-items: center; border: 1px solid rgba(255,255,255,.09); border-left: 3px solid var(--acc); background: rgba(255,255,255,.03); border-radius: 14px; padding: .75rem .9rem; cursor: pointer; transition: background .2s; }
.dg-tile:hover { background: rgba(255,255,255,.06); }
.dg-tile img { width: 56px; height: 40px; object-fit: cover; border-radius: 8px; }
.dg-tile b { display: block; font-size: .86rem; }
.dg-tile small { color: #6b7280; font-size: .72rem; }
.dg-statbar { display: flex; gap: 1rem; justify-content: center; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); backdrop-filter: blur(12px); border-radius: 16px; padding: .8rem 1.2rem; max-width: 620px; margin: 0 auto 2rem; }
.dg-stat { flex: 1; max-width: 130px; }
.dg-stat .top { display: flex; align-items: center; gap: .45rem; }
.dg-stat img { width: 22px; height: 22px; image-rendering: pixelated; }
.dg-stat .lab { font-size: .62rem; letter-spacing: .1em; color: #9ca3af; text-transform: uppercase; }
.dg-stat .val { margin-left: auto; font-variant-numeric: tabular-nums; font-size: .82rem; }
.dg-track { height: 5px; border-radius: 3px; background: rgba(255,255,255,.08); margin-top: .45rem; overflow: hidden; }
.dg-track i { display: block; height: 100%; border-radius: 3px; background: #22d3ee; width: calc(var(--v) * 1%); transition: width .4s; }
.dg-stat.danger .dg-track i { background: #ff5d5d; }
.dg-stat.danger .val { color: #ff5d5d; animation: dg-pulse 1.2s ease-in-out infinite; }
@keyframes dg-pulse { 50% { opacity: .5; } }
.dg-card { max-width: 420px; margin: 0 auto; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,.16); outline: 1px solid rgba(255,82,225,.35); background: rgba(20,23,36,.85); backdrop-filter: blur(14px); box-shadow: 0 30px 70px rgba(0,0,0,.6); animation: dg-in .45s cubic-bezier(.2,.8,.3,1); position: relative; }
@keyframes dg-in { from { transform: translateY(26px) scale(.97); opacity: 0; } to { transform: none; opacity: 1; } }
.dg-card img.art { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block; }
.dg-chip { position: absolute; top: .8rem; left: .8rem; display: flex; align-items: center; gap: .4rem; background: rgba(10,12,21,.75); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: .28rem .7rem .28rem .4rem; font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; color: #d1d5db; }
.dg-chip img { width: 18px; height: 18px; image-rendering: pixelated; }
.dg-card .prompt { padding: 1.2rem 1.3rem 1.4rem; color: #d1d5db; line-height: 1.55; font-size: .98rem; }
.dg-choices { max-width: 420px; margin: .9rem auto 0; display: flex; gap: .8rem; }
.dg-choice { flex: 1; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: .7rem .9rem; font-size: .82rem; color: #d1d5db; cursor: pointer; background: rgba(255,255,255,.03); transition: border-color .2s; text-align: center; }
.dg-choice:hover { border-color: #ff52e1; }
.dg-choice small { display: block; color: #6b7280; font-size: .62rem; letter-spacing: .2em; margin-bottom: .3rem; }
.dg-dots { display: flex; gap: .3rem; justify-content: center; margin-top: 2rem; }
.dg-dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.14); }
.dg-dots i.done { background: #ff52e1; }
.dg-node { text-align: center; color: #6b7280; font-size: .72rem; margin-top: .7rem; letter-spacing: .2em; }
`;

const DisciplinedGlass: React.FC<VariantProps> = ({ screen }) => (
  <div className="dg-root">
    <style>{CSS}</style>
    <div className="dg-wrap">
      {screen === 'menu' ? (
        <>
          <div className="dg-hero">
            <div>
              <p className="dg-eyebrow">A RetroVerse Studios game</p>
              <h1 className="dg-h1">Swipe to shape the fate of <em>entire realities</em>.</h1>
              <p className="dg-lead">Every card is a dilemma. Keep Power, Wealth, People and Knowledge in balance — or your reign ends.</p>
              <span className="dg-cta">▶ Continue: Cyberpunk Dystopia</span>
              <span className="dg-ghost">Creator Hub</span>
            </div>
            <div className="dg-feature">
              <img src={MOCK_REALITIES[0].art} alt="" />
              <div className="cap"><b>{MOCK_REALITIES[0].name}</b><span>Last played</span></div>
            </div>
          </div>
          <div className="dg-row">
            {MOCK_REALITIES.map(r => (
              <div key={r.id} className="dg-tile" style={{ ['--acc' as string]: r.accent }}>
                <img src={r.art} alt="" />
                <span><b>{r.name}</b><small>{r.tagline}</small></span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="dg-statbar">
            {MOCK_STATS.map(s => (
              <div key={s.key} className={`dg-stat${isDanger(s.value) ? ' danger' : ''}`} style={{ ['--v' as string]: s.value }}>
                <div className="top"><img src={s.badge} alt="" /><span className="lab">{s.label}</span><span className="val">{s.value}</span></div>
                <div className="dg-track"><i /></div>
              </div>
            ))}
          </div>
          <div className="dg-card">
            <img className="art" src={MOCK_CARD.art} alt="" />
            <div className="dg-chip"><img src={MOCK_CARD.badge} alt="" />{MOCK_CARD.archetype}</div>
            <p className="prompt">{MOCK_CARD.prompt}</p>
          </div>
          <div className="dg-choices">
            <div className="dg-choice"><small>⇦ Swipe left</small>{MOCK_CARD.left}</div>
            <div className="dg-choice"><small>Swipe right ⇨</small>{MOCK_CARD.right}</div>
          </div>
          <div className="dg-dots">{Array.from({ length: 20 }, (_, i) => <i key={i} className={i < 7 ? 'done' : ''} />)}</div>
          <p className="dg-node">{NODE_LABEL}</p>
        </>
      )}
    </div>
  </div>
);

export default DisciplinedGlass;
