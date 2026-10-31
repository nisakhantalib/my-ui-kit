import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './index.css';
import { App } from './App';

// A shareable link straight into the demo: …/my-ui-kit/?demo skips the sign-in screen.
if (new URLSearchParams(location.search).has('demo')) {
  try {
    localStorage.setItem('signed-in', 'true');
  } catch {
    /* storage blocked: the sign-in screen still works */
  }
  history.replaceState(null, '', location.pathname + location.hash);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
