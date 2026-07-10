/**
 * Shell themes — the player-facing "feel" of the game (main menu, game
 * screen, game over). Utility screens (editor, store, settings, modals) stay
 * on one neutral chrome regardless of shell.
 */

export type ShellThemeId = 'tarot' | 'crt' | 'handheld';

export const SHELL_THEMES: { id: ShellThemeId; name: string; description: string }[] = [
  { id: 'tarot', name: 'Neon Tarot', description: 'Velvet, gold and wax seals — fate dealt by candlelight' },
  { id: 'crt', name: 'CRT Arcade', description: 'Scanlines, phosphor glow and INSERT COIN' },
  { id: 'handheld', name: 'Handheld', description: 'Cartridges, chunky pixels and that little green screen' },
];

const STORAGE_KEY = 'swipeverse-shell-theme';

export function loadShellTheme(): ShellThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'tarot' || stored === 'crt' || stored === 'handheld') return stored;
  } catch { /* default */ }
  return 'tarot';
}

export function saveShellTheme(theme: ShellThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save shell theme:', error);
  }
}
