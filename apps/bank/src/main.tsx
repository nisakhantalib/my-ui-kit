import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
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
