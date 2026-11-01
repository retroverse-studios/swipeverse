import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // 'unsafe-inline' for React inline style props
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  // Card art can be a remote URL from deck/store data
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "worker-src 'self'",
  "manifest-src 'self'",
  // AI providers, the store catalog, deckUrl and ?play= fetches, and
  // user-configured OpenAI-compatible endpoints are arbitrary HTTPS hosts
  "connect-src 'self' https: http://localhost:11434",
].join('; ');

// Build-only: the dev server needs inline scripts for HMR
function injectCsp(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: () => [{
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
      injectTo: 'head-prepend',
    }],
  };
}

// Stamp the service-worker cache name per build so unhashed assets
// (card art, CDN-era leftovers) can't go stale across deploys
function stampServiceWorker(): Plugin {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (!fs.existsSync(swPath)) return;
      const stamp = `swipeverse-${Date.now().toString(36)}`;
      fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace(/swipeverse-v\d+/, stamp));
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Keys from .env.local are a dev convenience only. `define` inlines these as
    // literal strings in the JS bundle, so injecting them in a production build
    // would hand the keys to every visitor. Production users supply their own
    // keys via the in-app AI Settings (stored in localStorage).
    const isDev = mode === 'development';
    return {
      // '/' locally and on the custom domain; the Pages workflow sets
      // PAGES_BASE=/swipeverse/ while serving from github.io/swipeverse/.
      base: process.env.PAGES_BASE || '/',
      plugins: [injectCsp(), stampServiceWorker()],
      define: {
        'process.env.API_KEY': JSON.stringify(isDev ? env.GEMINI_API_KEY || '' : ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(isDev ? env.GEMINI_API_KEY || '' : ''),
        'process.env.OPENAI_API_KEY': JSON.stringify(isDev ? env.OPENAI_API_KEY || '' : ''),
        'process.env.ANTHROPIC_API_KEY': JSON.stringify(isDev ? env.ANTHROPIC_API_KEY || '' : ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'reactflow': ['reactflow'],
              'genai': ['@google/genai'],
            }
          }
        }
      }
    };
});
