/// <reference types="vite/client" />

/**
 * BeforeInstallPromptEvent — fired when the browser is ready to prompt
 * the user to install the PWA. Not yet in standard TypeScript lib.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}
