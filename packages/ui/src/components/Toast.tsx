import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../utils.js';
import { VisuallyHidden } from './VisuallyHidden.js';

/**
 * Short, non-blocking confirmations ("Booking saved"). Put <ToastProvider> once near the root:
 *
 *   const toast = useToast();
 *   toast({ title: 'Booking saved', tone: 'success' });
 *   toast({ title: 'Booking cancelled', action: { label: 'Undo', onClick: restore } });
 *
 * Accessibility decisions:
 * - Text is announced through a live region that exists before any toast, because a freshly
 *   inserted role="status" element is not reliably read by every screen reader.
 * - Toasts with an action never time out (WCAG 2.2.1 Timing Adjustable); others pause while
 *   hovered or focused, so they can be read at any speed.
 * - Toasts never take focus. Anything the user must act on belongs in a Dialog.
 */

type Tone = 'info' | 'success' | 'danger';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: Tone;
  /** Milliseconds before it hides. Default 6000. Ignored when there is an action. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastOptions {
  id: number;
}

type ShowToast = (options: ToastOptions) => () => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children, label = 'Notifications' }: { children: ReactNode; label?: string }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [message, setMessage] = useState('');
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback<ShowToast>(
    (options) => {
      const id = ++nextId.current;
      setToasts((all) => [...all, { ...options, id }]);
      // Clear first, then set, so the same message twice in a row is still read.
      setMessage('');
      requestAnimationFrame(() => setMessage([options.title, options.description].filter(Boolean).join('. ')));
      return () => dismiss(id);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <section aria-label={label} className="kit-toaster">
        <ol className="kit-toaster__list">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
      <VisuallyHidden>
        <span role="status" aria-live="polite" aria-atomic="true">
          {message}
        </span>
      </VisuallyHidden>
    </ToastContext.Provider>
  );
}

// onDismiss is the provider's stable callback, so a new toast doesn't restart the others' timers.
function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const { id, title, description, tone = 'info', duration = 6000, action } = toast;
  const [paused, setPaused] = useState(false);
  const persistent = action !== undefined || duration === Infinity;

  useEffect(() => {
    if (persistent || paused) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [persistent, paused, duration, onDismiss, id]);

  return (
    <li
      className={cx('kit-toast', `kit-toast--${tone}`)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
    >
      <div className="kit-toast__body">
        <p className="kit-toast__title">{title}</p>
        {description && <p className="kit-toast__desc">{description}</p>}
      </div>
      {action && (
        <button
          type="button"
          className="kit-toast__action"
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
        >
          {action.label}
        </button>
      )}
      <button type="button" className="kit-toast__close" aria-label={`Dismiss: ${title}`} onClick={() => onDismiss(id)}>
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}

/** Returns `toast(options)`, which shows a toast and returns a function that dismisses it. */
export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}
