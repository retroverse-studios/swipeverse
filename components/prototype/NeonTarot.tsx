/** PROTOTYPE variant B — Neon Tarot. Throwaway. */
import React from 'react';
import { MOCK_REALITIES, MOCK_CARD, MOCK_STATS, NODE_LABEL, isDanger, VariantProps } from './mockData';

const CSS = `
.nt-root { min-height: 100vh; background: radial-gradient(120% 100% at 50% 0%, #1c1030 0%, #0d0718 55%, #060310 100%); font-family: 'Cinzel', serif; color: #e9dfc8; padding: 3rem 1.5rem 5rem; }
.nt-title { text-align: center; font-weight: 800; font-size: clamp(1.8rem, 4.5vw, 3rem); letter-spacing: .14em; background: linear-gradient(180deg, #f6e4a8, #c9962e 60%, #8a6a1c); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 18px rgba(201,150,46,.35)); }
.nt-sub { text-align: center; color: #9a8db4; letter-spacing: .3em; font-size: .85rem; margin-top: .4rem; text-transform: uppercase; }
.nt-fan { display: flex; justify-content: center; align-items: flex-end; gap: 0; margin-top: 3.2rem; perspective: 900px; }
.nt-tarot { width: 200px; aspect-ratio: 3/4.6; border-radius: 14px; position: relative; margin: 0 -14px; cursor: pointer; transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s; background: #0d0718; border: 2px solid #c9962e; box-shadow: 0 18px 50px rgba(0,0,0,.7), inset 0 0 0 6px #0d0718, inset 0 0 0 7px rgba(201,150,46,.55); overflow: hidden; }
.nt-tarot:nth-child(1) { transform: rotate(-9deg) translateY(16px); }
.nt-tarot:nth-child(3) { transform: rotate(9deg) translateY(16px); }
.nt-tarot:hover { transform: rotate(0) translateY(-18px) scale(1.05); box-shadow: 0 30px 70px rgba(0,0,0,.85), 0 0 34px var(--acc), inset 0 0 0 6px #0d0718, inset 0 0 0 7px var(--acc); z-index: 2; }
.nt-tarot img { position: absolute; inset: 10px; width: calc(100% - 20px); height: calc(100% - 20px); object-fit: cover; border-radius: 8px; opacity: .92; }
.nt-plate { position: absolute; left: 10px; right: 10px; bottom: 10px; background: linear-gradient(180deg, rgba(13,7,24,.2), rgba(13,7,24,.92) 40%); padding: 1.6rem .6rem .7rem; text-align: center; border-radius: 0 0 8px 8px; }
.nt-plate b { display: block; font-size: .95rem; letter-spacing: .08em; color: #f6e4a8; }
.nt-plate small { color: #9a8db4; font-size: .68rem; font-family: 'Exo 2', sans-serif; letter-spacing: .04em; }
.nt-menu-foot { text-align: center; margin-top: 3rem; color: #9a8db4; font-size: .8rem; letter-spacing: .25em; text-transform: uppercase; }
.nt-menu-foot a { color: #c9962e; }
.nt-orbs { display: flex; justify-content: center; gap: 2.2rem; margin-bottom: 2.2rem; }
.nt-orb { text-align: center; }
.nt-orb .ring { width: 64px; height: 64px; border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; background: conic-gradient(var(--acc) calc(var(--v) * 1%), rgba(255,255,255,.07) 0); box-shadow: 0 0 18px color-mix(in srgb, var(--acc) 45%, transparent); }
.nt-orb .ring::before { content: ''; position: absolute; inset: 5px; border-radius: 50%; background: #0d0718; }
.nt-orb img { position: relative; width: 34px; height: 34px; image-rendering: pixelated; }
.nt-orb .val { position: absolute; bottom: -6px; right: -6px; background: #0d0718; border: 1px solid var(--acc); border-radius: 999px; font-size: .7rem; padding: .05rem .4rem; color: #e9dfc8; font-family: 'Exo 2', sans-serif; }
.nt-orb small { display: block; margin-top: .55rem; font-size: .62rem; letter-spacing: .18em; color: #9a8db4; text-transform: uppercase; }
.nt-orb.danger .ring { animation: nt-pulse 1.2s ease-in-out infinite; }
@keyframes nt-pulse { 50% { box-shadow: 0 0 30px #ff5d5d; } }
.nt-stage { position: relative; max-width: 430px; margin: 0 auto; }
.nt-deck { position: absolute; left: 50%; bottom: -34px; transform: translateX(-50%); width: 90px; aspect-ratio: 3/4.2; border-radius: 8px; border: 1px solid rgba(201,150,46,.6); background-size: cover; background-position: center; box-shadow: 0 6px 0 -2px #0d0718, 0 8px 0 -2px rgba(201,150,46,.4), 0 14px 0 -4px #0d0718, 0 16px 0 -4px rgba(201,150,46,.3); }
.nt-card { position: relative; border-radius: 16px; background: #120a22; border: 2px solid #c9962e; box-shadow: inset 0 0 0 7px #120a22, inset 0 0 0 8px rgba(201,150,46,.5), 0 26px 60px rgba(0,0,0,.75); overflow: hidden; animation: nt-rise .6s cubic-bezier(.2,.8,.3,1); }
@keyframes nt-rise { from { transform: translateY(70px) rotate(2deg); opacity: 0; } to { transform: none; opacity: 1; } }
.nt-card img.art { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block; }
.nt-card .prompt { padding: 1.3rem 1.4rem 1.6rem; font-family: 'Exo 2', sans-serif; color: #ded4c0; font-size: 1.02rem; line-height: 1.55; text-align: center; }
.nt-seal { position: absolute; top: calc(66% - 30px); left: 50%; transform: translateX(-50%); width: 56px; height: 56px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #d44a6f, #7c1230 70%); box-shadow: 0 4px 14px rgba(0,0,0,.6), inset 0 0 0 3px rgba(255,255,255,.15); display: flex; align-items: center; justify-content: center; }
.nt-seal img { width: 30px; height: 30px; image-rendering: pixelated; filter: brightness(1.5) saturate(.4); }
.nt-plaques { display: flex; justify-content: space-between; gap: 1rem; max-width: 430px; margin: 1.4rem auto 0; }
.nt-plq { flex: 1; border: 1px solid rgba(201,150,46,.5); background: linear-gradient(180deg, rgba(201,150,46,.10), rgba(201,150,46,.03)); padding: .7rem .9rem; border-radius: 10px; text-align: center; font-family: 'Exo 2', sans-serif; font-size: .86rem; color: #e9dfc8; }
.nt-plq small { display: block; color: #c9962e; font-family: 'Cinzel', serif; letter-spacing: .25em; font-size: .6rem; margin-bottom: .3rem; }
.nt-node { text-align: center; margin-top: 3.4rem; color: #9a8db4; letter-spacing: .35em; font-size: .72rem; text-transform: uppercase; }
`;

const NeonTarot: React.FC<VariantProps> = ({ screen }) => (
  <div className="nt-root">
    <style>{CSS}</style>
    {screen === 'menu' ? (
      <>
        <h1 className="nt-title">SWIPEVERSE</h1>
        <p className="nt-sub">The fate of realities, dealt one card at a time</p>
        <div className="nt-fan">
          {MOCK_REALITIES.map(r => (
            <div key={r.id} className="nt-tarot" style={{ ['--acc' as string]: r.accent }}>
              <img src={r.back} alt="" />
              <div className="nt-plate"><b>{r.name}</b><small>{r.tagline}</small></div>
            </div>
          ))}
        </div>
        <p className="nt-menu-foot">Creator Hub · Store · AI Settings</p>
      </>
    ) : (
      <>
        <div className="nt-orbs">
          {MOCK_STATS.map(s => (
            <div key={s.key} className={`nt-orb${isDanger(s.value) ? ' danger' : ''}`}
                 style={{ ['--acc' as string]: isDanger(s.value) ? '#ff5d5d' : '#c9962e', ['--v' as string]: s.value }}>
              <div className="ring"><img src={s.badge} alt="" /><span className="val">{s.value}</span></div>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
        <div className="nt-stage">
          <div className="nt-deck" style={{ backgroundImage: `url(${MOCK_CARD.back})` }} />
          <div className="nt-card">
            <img className="art" src={MOCK_CARD.art} alt="" />
            <p className="prompt">{MOCK_CARD.prompt}</p>
          </div>
          <div className="nt-seal"><img src={MOCK_CARD.badge} alt="" /></div>
        </div>
        <div className="nt-plaques">
          <div className="nt-plq"><small>Sinister</small>{MOCK_CARD.left}</div>
          <div className="nt-plq"><small>Dexter</small>{MOCK_CARD.right}</div>
        </div>
        <p className="nt-node">{NODE_LABEL}</p>
      </>
    )}
  </div>
);

export default NeonTarot;
