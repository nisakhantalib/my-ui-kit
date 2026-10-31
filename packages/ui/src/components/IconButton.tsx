import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils.js';
import { useTrack } from '../analytics/analytics.js';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  /** Required accessible name: an icon alone says nothing to a screen reader (WCAG 4.1.2). */
  label: string;
  /** Decorative icon element, e.g. a Lucide icon. It is hidden from assistive technology. */
  icon: ReactNode;
  variant?: 'ghost' | 'secondary' | 'primary';
  size?: 'sm' | 'md';
  /** Show a dot, e.g. unread notifications. Say so in `label` too ("Notifications, 2 unread"). */
  badge?: boolean;
  trackId?: string;
}

/** Icon-only button. Keeps the 44px target (24px for `sm`) even though the icon is small. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', size = 'md', badge, trackId, className, onClick, type = 'button', ...rest },
  ref,
) {
  const track = useTrack();
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cx('kit-icon-btn', `kit-icon-btn--${variant}`, `kit-icon-btn--${size}`, className)}
      onClick={(e) => {
        if (trackId) track('button_click', { component: 'IconButton', id: trackId });
        onClick?.(e);
      }}
      {...rest}
    >
      <span className="kit-icon-btn__icon" aria-hidden="true">
        {icon}
      </span>
      {badge && <span className="kit-icon-btn__badge" aria-hidden="true" />}
    </button>
  );
});
