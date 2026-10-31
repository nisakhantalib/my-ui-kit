import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { VisuallyHidden } from './VisuallyHidden.js';

/**
 * Screen-reader announcements for things that change without a page load
 * ("3 results found", "Transfer sent"). Renders two live regions once at the app root.
 */

type Politeness = 'polite' | 'assertive';
type Announce = (message: string, politeness?: Politeness) => void;

const AnnouncerContext = createContext<Announce>(() => {});

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    const set = politeness === 'assertive' ? setAssertive : setPolite;
    // Clear first, then set on the next tick so the same message twice is still re-read.
    set('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => set(message), 50);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <VisuallyHidden>
        <div role="status" aria-live="polite" aria-atomic="true" data-testid="kit-announcer-polite">
          {polite}
        </div>
        <div role="alert" aria-live="assertive" aria-atomic="true" data-testid="kit-announcer-assertive">
          {assertive}
        </div>
      </VisuallyHidden>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): Announce {
  return useContext(AnnouncerContext);
}
