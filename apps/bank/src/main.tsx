import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './index.css';
import { App } from './App';
import { APP, fromLegacyHash } from './router';

// A shareable link straight into the demo: /?demo, /app/cards?demo or an old /?demo#/cards skips sign-in.
if (new URLSearchParams(location.search).has('demo')) {
  try {
    localStorage.setItem('signed-in', 'true');
  } catch {
    /* storage blocked: the sign-in screen still works */
  }
  // Keep the page if it's already an app URL (/app/cards?demo), else follow an old #/ link.
  const target = location.pathname.startsWith(APP) ? location.pathname : (fromLegacyHash(location.hash) ?? APP);
  history.replaceState(null, '', target);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
