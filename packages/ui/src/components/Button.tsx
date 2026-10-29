import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cx } from '../utils.js';
import { useTrack } from '../analytics/analytics.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Shows a spinner, sets aria-busy, and blocks clicks while keeping the button focusable. */
  loading?: boolean;
  /** If set, a `button_click` analytics event is sent with this id. */
  trackId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, trackId, className, children, onClick, type = 'button', disabled, ...rest },
  ref,
) {
  const track = useTrack();

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    // aria-disabled (not `disabled`) keeps the button in the tab order so screen
    // reader users can still discover it, so we must block the click ourselves.
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    if (trackId) track('button_click', { component: 'Button', id: trackId });
    onClick?.(e);
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cx('kit-btn', `kit-btn--${variant}`, `kit-btn--${size}`, className)}
      aria-disabled={loading || disabled || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading && <span className="kit-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
});
