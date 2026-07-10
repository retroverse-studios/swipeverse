import { createContext, useContext } from 'react';
import { ShellThemeId } from '../services/shellTheme';

interface ShellThemeContextValue {
  shellTheme: ShellThemeId;
  setShellTheme: (theme: ShellThemeId) => void;
}

export const ShellThemeContext = createContext<ShellThemeContextValue>({
  shellTheme: 'tarot',
  setShellTheme: () => {},
});

export const useShellTheme = () => useContext(ShellThemeContext);

/** Page background per shell (player-facing screens). */
export const SHELL_BACKGROUNDS: Record<ShellThemeId, string> = {
  tarot: 'bg-velvet',
  crt: 'bg-[#05060a]',
  handheld: 'bg-gradient-to-br from-[#1a1e2e] to-[#0c0e18]',
};
