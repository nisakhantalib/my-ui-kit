import type { ReactNode } from 'react';

/** Internal building blocks shared by every form control, so hint and error text look and read the same everywhere. */

export function FieldHint({ id, children }: { id: string | undefined; children: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="kit-field__hint">
      {children}
    </p>
  );
}

/** Always rendered, so it is already a live region when the error appears and gets read out (WCAG 4.1.3). */
export function FieldError({ id, children }: { id: string | undefined; children: ReactNode }) {
  return (
    <p id={id} className="kit-field__error" aria-live="polite">
      {children && (
        <>
          <span aria-hidden="true">⚠ </span>
          {children}
        </>
      )}
    </p>
  );
}

export function RequiredMark({ show }: { show: boolean | undefined }) {
  if (!show) return null;
  // Screen readers get "required" from the control itself, so the asterisk is visual only.
  return (
    <span className="kit-field__required" aria-hidden="true">
      {' '}*
    </span>
  );
}
