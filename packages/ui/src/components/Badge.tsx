import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils.js';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** The dot carries the tone; the text stays in the body colour, so contrast never depends on the tone. */
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}

/** Short status label: "Pending", "Received". Always text, never colour alone (WCAG 1.4.1). */
export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx('kit-badge', `kit-badge--${tone}`, className)} {...rest}>
      <span className="kit-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export interface SkeletonProps {
  width?: CSSProperties['width'];
  /** Number of text lines to draw. Default 1. */
  lines?: number;
  /** 'text' lines, a 'block' (card, chart) or a 'circle' (avatar). */
  shape?: 'text' | 'block' | 'circle';
  className?: string;
}

/**
 * Loading placeholder. Hidden from screen readers: mark the region that's loading with
 * aria-busy="true" and announce when it's ready, instead of making people listen to shapes.
 * The shimmer stops under prefers-reduced-motion.
 */
export function Skeleton({ width, lines = 1, shape = 'text', className }: SkeletonProps) {
  return (
    <span aria-hidden="true" className={cx('kit-skeleton-group', className)}>
      {Array.from({ length: shape === 'text' ? lines : 1 }, (_, i) => (
        <span
          key={i}
          className={cx('kit-skeleton', `kit-skeleton--${shape}`)}
          // React sets this through CSSOM, which stays allowed under a strict style-src CSP.
          style={width !== undefined ? { width } : undefined}
        />
      ))}
    </span>
  );
}
