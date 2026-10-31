import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx, getFocusable } from '../utils.js';
import { useKit } from '../i18n.js';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Element to focus when the dialog opens. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 'alertdialog' for confirmations that interrupt the user (e.g. destructive actions). */
  role?: 'dialog' | 'alertdialog';
  /** 'center' (default) or 'sheet': a panel that slides in from the right, for details and side tasks. */
  placement?: 'center' | 'sheet';
  /** Show a close (×) button in the corner. Escape and the backdrop always close it too. */
  showClose?: boolean;
}

/**
 * Modal dialog following the WAI-ARIA APG pattern:
 * - focus moves into the dialog on open and returns to the trigger on close
 * - Tab / Shift+Tab are trapped inside
 * - Escape and backdrop click close it
 * - page scroll is locked while open
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusRef,
  role = 'dialog',
  placement = 'center',
  showClose = false,
}: DialogProps) {
  const { t } = useKit();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current!;
    const target = initialFocusRef?.current ?? getFocusable(panel)[0] ?? panel;
    target.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Make everything behind the dialog inert: not focusable, not clickable, and hidden
    // from screen readers. aria-modal alone is not honoured by every screen reader.
    const backdrop = panel.parentElement;
    const madeInert = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el !== backdrop && el instanceof HTMLElement && !el.inert,
    );
    madeInert.forEach((el) => (el.inert = true));

    return () => {
      madeInert.forEach((el) => (el.inert = false));
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = getFocusable(panelRef.current!);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    // Backdrop click is a mouse convenience; Escape is the keyboard equivalent (handled on the panel).
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={cx('kit-dialog__backdrop', placement === 'sheet' && 'kit-dialog__backdrop--sheet')}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* role is dialog | alertdialog (a prop), which the lint rule can't see statically. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx('kit-dialog', placement === 'sheet' && 'kit-dialog--sheet')}
        onKeyDown={onKeyDown}
      >
        <div className="kit-dialog__header">
          <h2 id={titleId} className="kit-dialog__title">
            {title}
          </h2>
          {showClose && (
            <button type="button" className="kit-dialog__close" aria-label={t('dialog.close')} onClick={onClose}>
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        {description && (
          <p id={descId} className="kit-dialog__desc">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
