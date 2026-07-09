/** PROTOTYPE variant A — CRT Arcade. Throwaway. */
import React from 'react';
import { MOCK_REALITIES, MOCK_CARD, MOCK_STATS, NODE_LABEL, isDanger, VariantProps } from './mockData';

const CSS = `
.crt-root { min-height: 100vh; background: #05060a; display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: 'VT323', monospace; }
.crt-bezel { background: linear-gradient(160deg, #23252b, #101114); border-radius: 28px; padding: 26px 26px 40px; box-shadow: 0 30px 80px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.08); width: min(920px, 100%); position: relative; }
.crt-bezel::after { content: 'SWIPEVERSE // RETROVERSE STUDIOS'; position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; color: #4b4e57; font-size: 13px; letter-spacing: .35em; }
.crt-screen { position: relative; border-radius: 18px; overflow: hidden; background: radial-gradient(120% 90% at 50% 10%, #131a2e 0%, #090b14 70%); padding: 2.2rem 2.4rem 2.6rem; animation: crt-boot .9s ease-out; }
.crt-screen::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px); mix-blend-mode: multiply; }
.crt-screen::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(90% 70% at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%); }
@keyframes crt-boot { 0% { opacity: 0; transform: scaleY(.02); } 35% { opacity: 1; transform: scaleY(1.02); } 55% { transform: scaleY(.99); } 100% { transform: scaleY(1); } }
.crt-title { font-family: 'Press Start 2P', monospace; color: #ff52e1; text-shadow: 0 0 14px rgba(255,82,225,.8), 0 0 40px rgba(255,82,225,.4); font-size: clamp(1.1rem, 3.4vw, 2rem); text-align: center; letter-spacing: .08em; }
.crt-sub { text-align: center; color: #7fe7f5; font-size: 1.35rem; margin-top: .6rem; letter-spacing: .2em; }
.crt-blink { animation: crt-blink 1.1s steps(1) infinite; }
@keyframes crt-blink { 50% { opacity: 0; } }
.crt-list { margin: 2.2rem auto 0; max-width: 520px; display: flex; flex-direction: column; gap: .35rem; }
.crt-item { display: flex; align-items: baseline; gap: .9rem; font-size: 1.6rem; color: #aab3c7; padding: .35rem .8rem; cursor: pointer; }
.crt-item .cur { width: 1.2rem; color: transparent; }
.crt-item.sel { color: #fff; background: rgba(255,82,225,.12); outline: 1px solid rgba(255,82,225,.5); }
.crt-item.sel .cur { color: #ff52e1; animation: crt-blink 1.1s steps(1) infinite; }
.crt-item small { color: #5f6a80; font-size: 1.05rem; letter-spacing: .03em; }
.crt-foot { margin-top: 2.4rem; text-align: center; color: #5f6a80; font-size: 1.15rem; letter-spacing: .25em; }
.crt-hud { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 1.4rem; }
.crt-stat { flex: 1; }
.crt-stat .lab { font-size: 1.05rem; color: #7fe7f5; letter-spacing: .12em; display: flex; justify-content: space-between; }
.crt-blocks { display: flex; gap: 3px; margin-top: 4px; }
.crt-blocks i { flex: 1; height: 12px; background: #1b2233; outline: 1px solid rgba(255,255,255,.06); }
.crt-blocks i.on { background: #ff52e1; box-shadow: 0 0 6px rgba(255,82,225,.8); }
.crt-stat.danger .lab { color: #ff5d5d; }
.crt-stat.danger .crt-blocks i.on { background: #ff5d5d; box-shadow: 0 0 8px rgba(255,93,93,.9); animation: crt-blink .5s steps(1) infinite; }
.crt-card { max-width: 460px; margin: 0 auto; border: 3px solid #ff52e1; box-shadow: 0 0 0 3px #090b14, 0 0 24px rgba(255,82,225,.35); background: #0d1120; animation: crt-boot .5s ease-out; }
.crt-card img.art { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block; image-rendering: pixelated; border-bottom: 3px solid #ff52e1; }
.crt-card .body { padding: 1rem 1.2rem 1.2rem; }
.crt-card .prompt { color: #dfe6f5; font-size: 1.45rem; line-height: 1.35; }
.crt-badge { position: absolute; top: -18px; right: -18px; width: 52px; height: 52px; background: #090b14; border: 3px solid #7fe7f5; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.crt-badge img { width: 34px; height: 34px; image-rendering: pixelated; }
.crt-wrap { position: relative; max-width: 460px; margin: 0 auto; }
.crt-choices { display: flex; justify-content: space-between; gap: 1rem; max-width: 460px; margin: 1.1rem auto 0; font-size: 1.25rem; }
.crt-choices span { color: #7fe7f5; } .crt-choices b { color: #fff; font-weight: 400; }
.crt-node { text-align: center; color: #5f6a80; margin-top: 1.6rem; font-size: 1.2rem; letter-spacing: .3em; }
`;

const CrtArcade: React.FC<VariantProps> = ({ screen }) => (
  <div className="crt-root">
    <style>{CSS}</style>
    <div className="crt-bezel">
      <div className="crt-screen" key={screen}>
        {screen === 'menu' ? (
          <>
            <h1 className="crt-title">SWIPEVERSE</h1>
            <p className="crt-sub"><span className="crt-blink">▮</span> INSERT COIN · PRESS START</p>
            <div className="crt-list">
              {MOCK_REALITIES.map((r, i) => (
                <div key={r.id} className={`crt-item${i === 0 ? ' sel' : ''}`}>
                  <span className="cur">▶</span>
                  <span style={{ color: i === 0 ? r.accent : undefined }}>{r.name.toUpperCase()}</span>
                  <small>{r.tagline}</small>
                </div>
              ))}
              <div className="crt-item"><span className="cur">▶</span><span>CREATOR HUB</span><small>build your own reality</small></div>
              <div className="crt-item"><span className="cur">▶</span><span>STORE</span><small>community decks</small></div>
            </div>
            <p className="crt-foot">HI-SCORE 20 NODES · © RETROVERSE STUDIOS</p>
          </>
        ) : (
          <>
            <div className="crt-hud">
              {MOCK_STATS.map(s => (
                <div key={s.key} className={`crt-stat${isDanger(s.value) ? ' danger' : ''}`}>
                  <div className="lab"><span>{s.label.toUpperCase()}</span><span>{s.value}</span></div>
                  <div className="crt-blocks">
                    {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < Math.round(s.value / 10) ? 'on' : ''} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="crt-wrap">
              <div className="crt-card">
                <img className="art" src={MOCK_CARD.art} alt="" />
                <div className="body"><p className="prompt">{MOCK_CARD.prompt}</p></div>
              </div>
              <div className="crt-badge"><img src={MOCK_CARD.badge} alt="" /></div>
            </div>
            <div className="crt-choices">
              <span>◀ <b>{MOCK_CARD.left}</b></span>
              <span><b>{MOCK_CARD.right}</b> ▶</span>
            </div>
            <p className="crt-node">{NODE_LABEL}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

export default CrtArcade;
