/** PROTOTYPE variant C — Handheld Console. Throwaway. */
import React from 'react';
import { MOCK_REALITIES, MOCK_CARD, MOCK_STATS, isDanger, VariantProps } from './mockData';

const CSS = `
.hh-root { min-height: 100vh; background: linear-gradient(160deg, #1a1e2e, #0c0e18); display: flex; align-items: center; justify-content: center; padding: 1.5rem; font-family: 'VT323', monospace; }
.hh-body { background: linear-gradient(165deg, #8d87c9, #5f5a9e 60%, #4a4680); border-radius: 26px 26px 64px 26px; padding: 24px 26px 30px; width: min(460px, 100%); box-shadow: 0 30px 70px rgba(0,0,0,.7), inset 0 2px 0 rgba(255,255,255,.35), inset 0 -6px 12px rgba(0,0,0,.25); }
.hh-top { display: flex; justify-content: space-between; align-items: center; color: #2c2a4d; font-family: 'Press Start 2P', monospace; font-size: .5rem; letter-spacing: .18em; margin-bottom: 10px; }
.hh-led { width: 9px; height: 9px; border-radius: 50%; background: #ff5d5d; box-shadow: 0 0 8px #ff5d5d; display: inline-block; margin-right: 6px; }
.hh-screenframe { background: #2c2a4d; border-radius: 14px; padding: 16px 14px; box-shadow: inset 0 3px 8px rgba(0,0,0,.6); }
.hh-screen { background: #0f1a14; border-radius: 6px; overflow: hidden; position: relative; min-height: 400px; box-shadow: inset 0 0 0 2px rgba(163,255,190,.08); animation: hh-on .5s ease-out; }
@keyframes hh-on { from { filter: brightness(3) saturate(0); } to { filter: none; } }
.hh-screen * { image-rendering: pixelated; }
.hh-tint { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(rgba(163,255,190,.05), rgba(163,255,190,.02)); mix-blend-mode: screen; }
.hh-head { font-family: 'Press Start 2P', monospace; color: #a3ffbe; font-size: .62rem; text-align: center; padding: 12px 8px 8px; letter-spacing: .12em; text-shadow: 0 0 8px rgba(163,255,190,.5); }
.hh-carts { display: flex; flex-direction: column; gap: 10px; padding: 8px 14px 16px; }
.hh-cart { background: #23305c; border-radius: 6px 6px 3px 3px; padding: 7px 8px 9px; position: relative; cursor: pointer; border-top: 4px solid #16204a; transition: transform .15s; }
.hh-cart:hover { transform: translateY(-3px); }
.hh-cart::before { content: ''; position: absolute; top: -4px; left: 18px; right: 18px; height: 4px; background: #0d1330; border-radius: 2px 2px 0 0; }
.hh-cart .sticker { display: flex; gap: 9px; align-items: center; background: #d8d3c0; border-radius: 3px; padding: 5px; }
.hh-cart .sticker img { width: 64px; height: 42px; object-fit: cover; border-radius: 2px; }
.hh-cart .sticker b { font-family: 'Press Start 2P', monospace; font-size: .5rem; color: #23305c; display: block; line-height: 1.5; }
.hh-cart .sticker small { font-size: .95rem; color: #6b6552; line-height: 1.05; display: block; }
.hh-insert { text-align: center; color: #5c8a6b; font-size: 1.05rem; letter-spacing: .22em; padding-bottom: 10px; animation: hh-blink 1.2s steps(1) infinite; }
@keyframes hh-blink { 50% { opacity: .25; } }
.hh-hud { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; padding: 10px 12px 6px; }
.hh-stat { display: flex; align-items: center; gap: 6px; }
.hh-stat img { width: 20px; height: 20px; }
.hh-cells { display: flex; gap: 2px; }
.hh-cells i { width: 9px; height: 9px; background: #1d2c22; }
.hh-cells i.on { background: #a3ffbe; }
.hh-stat.danger .hh-cells i.on { background: #ff8f6b; animation: hh-blink .5s steps(1) infinite; }
.hh-gamecard { margin: 6px 12px 8px; background: #16241b; border: 2px solid #a3ffbe33; border-radius: 4px; overflow: hidden; animation: hh-slide .35s steps(6); }
@keyframes hh-slide { from { transform: translateX(105%); } to { transform: none; } }
.hh-gamecard img.art { width: 100%; aspect-ratio: 3/1.55; object-fit: cover; display: block; filter: saturate(.75) contrast(1.05); }
.hh-gamecard .prompt { padding: 8px 10px; color: #cfe8d5; font-size: 1.12rem; line-height: 1.18; }
.hh-btnhints { display: flex; justify-content: space-between; padding: 0 14px 10px; color: #5c8a6b; font-size: 1rem; }
.hh-controls { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 0 6px; }
.hh-dpad { position: relative; width: 84px; height: 84px; }
.hh-dpad i { position: absolute; background: #2c2a4d; border-radius: 4px; box-shadow: inset 0 -3px 0 rgba(0,0,0,.4); }
.hh-dpad i.h { top: 28px; left: 0; width: 84px; height: 28px; } .hh-dpad i.v { top: 0; left: 28px; width: 28px; height: 84px; }
.hh-ab { display: flex; gap: 14px; transform: rotate(-14deg); }
.hh-ab span { width: 40px; height: 40px; border-radius: 50%; background: #b0355a; box-shadow: inset 0 -4px 0 rgba(0,0,0,.35), 0 2px 4px rgba(0,0,0,.4); color: #f7d9e2; display: flex; align-items: center; justify-content: center; font-family: 'Press Start 2P', monospace; font-size: .55rem; }
.hh-speaker { position: absolute; right: 34px; bottom: 26px; display: flex; gap: 5px; transform: rotate(-24deg); }
.hh-speaker i { width: 5px; height: 34px; background: rgba(0,0,0,.25); border-radius: 3px; }
`;

const HandheldConsole: React.FC<VariantProps> = ({ screen }) => (
  <div className="hh-root">
    <style>{CSS}</style>
    <div className="hh-body" style={{ position: 'relative' }}>
      <div className="hh-top"><span><span className="hh-led" />POWER</span><span>SWIPEVERSE COLOR</span></div>
      <div className="hh-screenframe">
        <div className="hh-screen" key={screen}>
          <div className="hh-tint" />
          {screen === 'menu' ? (
            <>
              <div className="hh-head">SELECT CARTRIDGE</div>
              <div className="hh-carts">
                {MOCK_REALITIES.map(r => (
                  <div key={r.id} className="hh-cart">
                    <div className="sticker">
                      <img src={r.art} alt="" />
                      <span><b>{r.name.toUpperCase()}</b><small>{r.tagline}</small></span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hh-insert">▼ INSERT TO PLAY ▼</div>
            </>
          ) : (
            <>
              <div className="hh-hud">
                {MOCK_STATS.map(s => (
                  <div key={s.key} className={`hh-stat${isDanger(s.value) ? ' danger' : ''}`}>
                    <img src={s.badge} alt="" title={s.label} />
                    <div className="hh-cells">
                      {Array.from({ length: 8 }, (_, i) => <i key={i} className={i < Math.round(s.value / 12.5) ? 'on' : ''} />)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hh-gamecard">
                <img className="art" src={MOCK_CARD.art} alt="" />
                <p className="prompt">{MOCK_CARD.prompt}</p>
              </div>
              <div className="hh-btnhints"><span>◀ B · {MOCK_CARD.left.slice(0, 18)}…</span><span>{MOCK_CARD.right.slice(0, 18)}… · A ▶</span></div>
            </>
          )}
        </div>
      </div>
      <div className="hh-controls">
        <div className="hh-dpad"><i className="h" /><i className="v" /></div>
        <div className="hh-ab"><span>B</span><span>A</span></div>
      </div>
      <div className="hh-speaker">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</div>
    </div>
  </div>
);

export default HandheldConsole;
