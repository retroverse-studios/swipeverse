const CACHE_NAME = 'swipeverse-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.tsx',
  '/services/geminiService.ts',
  '/services/aiProvider.ts',
  '/services/geminiProvider.ts',
  '/services/openaiProvider.ts',
  '/services/claudeProvider.ts',
  '/services/ollamaProvider.ts',
  '/components/AISettingsModal.tsx',
  '/components/GameOverScreen.tsx',
  '/services/gameHistory.ts',
  '/components/MainMenu.tsx',
  '/components/GameScreen.tsx',
  '/components/GameOverScreen.tsx',
  '/components/CardStack.tsx',
  '/components/StatBar.tsx',
  '/components/icons.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100..900;1,100..900&family=MedievalSharp&family=Orbitron:wght@400..900&display=swap',
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react-dom@^19.1.1/client',
  'https://esm.sh/@google/genai@^1.12.0'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We don't cache calls to the genai api
                if (!event.request.url.includes('generativelanguage') &&
                    !event.request.url.includes('api.openai.com') &&
                    !event.request.url.includes('api.anthropic.com') &&
                    !event.request.url.includes('localhost:11434')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
