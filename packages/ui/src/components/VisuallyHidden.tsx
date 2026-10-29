import type { ReactNode } from 'react';

/** Hidden on screen, still read by screen readers. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="kit-sr-only">{children}</span>;
}

/** First focusable element on the page; lets keyboard users jump past the header (WCAG 2.4.1). */
export function SkipLink({
  href = '#main',
  children = 'Skip to main content',
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <a className="kit-skip-link" href={href}>
      {children}
    </a>
  );
}
