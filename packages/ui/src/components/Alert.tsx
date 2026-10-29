import { forwardRef, useEffect, useRef, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { cx, useMergedRef } from '../utils.js';
import { VisuallyHidden } from './VisuallyHidden.js';

type Tone = 'info' | 'success' | 'warning' | 'danger';

/** Spoken before the message, so the tone is not conveyed by colour and icon alone (WCAG 1.4.1). */
const TONE_LABEL: Record<Tone, string> = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
};

const TONE_ICON: Record<Tone, string> = { info: 'i', success: '✓', warning: '!', danger: '!' };

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  tone?: Tone;
  title?: ReactNode;
  /**
   * Leave unset for messages that are on the page when it loads.
   * 'status' (polite) or 'alert' (interrupts) only for messages that appear after a user action;
   * the element must be rendered empty first for the announcement to be reliable.
   */
  role?: 'status' | 'alert';
  children?: ReactNode;
}

/** Inline message banner. For short-lived confirmations use a toast; for form errors use ErrorSummary. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'info', title, role, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} role={role} className={cx('kit-alert', `kit-alert--${tone}`, className)} {...rest}>
      <span className="kit-alert__icon" aria-hidden="true">
        {TONE_ICON[tone]}
      </span>
      <div className="kit-alert__body">
        {title ? (
          <p className="kit-alert__title">
            <VisuallyHidden>{TONE_LABEL[tone]}: </VisuallyHidden>
            {title}
          </p>
        ) : (
          <VisuallyHidden>{TONE_LABEL[tone]}: </VisuallyHidden>
        )}
        {children && <div className="kit-alert__content">{children}</div>}
      </div>
    </div>
  );
});

export interface ErrorSummaryProps {
  title?: string;
  /** `id` is the id of the field with the problem; the link moves focus there. */
  errors: { id: string; message: string }[];
  /** Move focus to the summary when errors appear (the GOV.UK / SGDS pattern). Default true. */
  focusOnShow?: boolean;
  className?: string;
}

/**
 * Lists every error on a form after submit, each linking to its field. Focus moves to the
 * summary, so screen-reader users hear the title and count straight away (WCAG 3.3.1, 2.4.3).
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary(
  { title = 'There is a problem', errors, focusOnShow = true, className },
  ref,
) {
  const [mergedRef, local] = useMergedRef(ref);
  const count = errors.length;
  const signature = errors.map((e) => e.id).join('|');
  const lastFocused = useRef('');

  useEffect(() => {
    // Refocus only when the set of errors changes, not on every re-render.
    if (!focusOnShow || count === 0 || lastFocused.current === signature) return;
    lastFocused.current = signature;
    local.current?.focus();
  }, [focusOnShow, count, signature, local]);

  if (count === 0) return null;

  function jump(e: MouseEvent<HTMLAnchorElement>, id: string) {
    const field = document.getElementById(id);
    if (!field) return;
    e.preventDefault();
    // Scroll the label into view too, not just the input, so the question is visible.
    (field.closest('.kit-field, .kit-check, fieldset') ?? field).scrollIntoView({ block: 'center' });
    const target = field.matches('fieldset') ? field.querySelector<HTMLElement>('input:not([disabled])') : field;
    target?.focus({ preventScroll: true });
  }

  return (
    // Focusing the container makes screen readers read the heading and the list together.
    <div ref={mergedRef} tabIndex={-1} className={cx('kit-error-summary', className)}>
      <h2 className="kit-error-summary__title">
        {title}
        <VisuallyHidden>{`, ${count} ${count === 1 ? 'error' : 'errors'}`}</VisuallyHidden>
      </h2>
      <ul className="kit-error-summary__list">
        {errors.map((err) => (
          <li key={err.id}>
            <a href={`#${err.id}`} onClick={(e) => jump(e, err.id)}>
              {err.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
