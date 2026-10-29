import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@nisakhantalib/my-ui-kit/styles.css';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
