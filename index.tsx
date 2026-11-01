import React from 'react';
import ReactDOM from 'react-dom/client';
// Bundled fonts (SIL OFL) — self-hosted, no Google Fonts requests
import '@fontsource-variable/exo-2';
import '@fontsource-variable/orbitron';
import '@fontsource/medievalsharp';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/800.css';
import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA service worker (registration lives here, not an inline script, so the
// build-time CSP needs no 'unsafe-inline' for scripts)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch((error) => console.warn('Service Worker registration failed:', error));
  });
}
