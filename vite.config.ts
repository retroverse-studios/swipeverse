import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Keys from .env.local are a dev convenience only. `define` inlines these as
    // literal strings in the JS bundle, so injecting them in a production build
    // would hand the keys to every visitor. Production users supply their own
    // keys via the in-app AI Settings (stored in localStorage).
    const isDev = mode === 'development';
    return {
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
