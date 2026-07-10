import React from 'react';

/**
 * Shared shell wrappers for the themed player-facing screens
 * (main menu, game screen, game over).
 */

/** CRT Arcade: everything renders inside a bezel + scanlined screen. */
export const CrtShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-full h-full flex items-center justify-center p-3 md:p-6 font-vt">
    <div className="crt-bezel w-full max-w-4xl h-[94%] p-3 pb-8 md:p-5 md:pb-10 relative">
      <div className="crt-screen w-full h-full animate-crt-boot overflow-y-auto">
        {children}
      </div>
      <p className="absolute bottom-2 md:bottom-3 left-0 right-0 text-center text-[#4b4e57] text-[10px] md:text-xs tracking-[0.35em] font-vt select-none">
        SWIPEVERSE // RETROVERSE STUDIOS
      </p>
    </div>
  </div>
);

/**
 * Handheld: a console body around a green-tinted screen. On small viewports
 * the plastic slims down and the decorative controls disappear ("LCD mode")
 * so the game keeps its screen space.
 */
export const HandheldShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-full h-full flex items-center justify-center p-2 md:p-6 font-vt">
    <div className="hh-body w-full max-w-md p-3 pb-4 md:p-6 md:pb-8 max-h-full flex flex-col">
      <div className="hidden md:flex justify-between items-center text-[#2c2a4d] font-pixel text-[8px] tracking-[0.18em] mb-2.5 select-none">
        <span className="flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-[#ff5d5d] shadow-[0_0_8px_#ff5d5d] inline-block" />
          POWER
        </span>
        <span>SWIPEVERSE COLOR</span>
      </div>
      <div className="hh-screenframe rounded-xl p-2 md:p-4 flex-grow min-h-0">
        <div className="hh-screen rounded-md h-full overflow-y-auto animate-hh-on">
          {children}
        </div>
      </div>
      <div className="hidden md:flex justify-between items-center mt-5 px-1 select-none">
        <div className="relative w-[72px] h-[72px]">
          <i className="absolute top-[24px] left-0 w-[72px] h-[24px] bg-[#2c2a4d] rounded shadow-[inset_0_-3px_0_rgba(0,0,0,.4)]" />
          <i className="absolute top-0 left-[24px] w-[24px] h-[72px] bg-[#2c2a4d] rounded shadow-[inset_0_-3px_0_rgba(0,0,0,.4)]" />
        </div>
        <div className="flex gap-3 -rotate-12">
          {['B', 'A'].map(b => (
            <span key={b} className="w-9 h-9 rounded-full bg-[#b0355a] shadow-[inset_0_-4px_0_rgba(0,0,0,.35),0_2px_4px_rgba(0,0,0,.4)] text-[#f7d9e2] flex items-center justify-center font-pixel text-[9px]">
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);
