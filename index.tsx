import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// PROTOTYPE hook (dev only, dead-code-eliminated from production builds):
// ?variant=A|B|C|D mounts the design-refresh direction mockups instead of the app.
const isDesignPrototype =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('variant');

const root = ReactDOM.createRoot(rootElement);

if (isDesignPrototype) {
  const DesignPrototype = React.lazy(() => import('./components/prototype/DesignPrototype'));
  root.render(
    <React.Suspense fallback={null}>
      <DesignPrototype />
    </React.Suspense>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}