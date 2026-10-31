import { useId } from 'react';

/** Orchid mark: five petals. Decorative; the brand name next to it is the accessible text. */
export function Logo({
  size = 32,
  onBrand = false,
}: {
  size?: number;
  /** On a brand-surface background: a light tile. */ onBrand?: boolean;
}) {
  // Unique per instance: two logos sharing an id break when the first one is hidden (display: none).
  const gradient = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--kit-primary)" />
          <stop offset="1" stopColor="var(--kit-accent)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={onBrand ? 'var(--kit-on-brand-surface)' : `url(#${gradient})`} />
      <g fill={onBrand ? 'var(--kit-brand-surface)' : 'var(--kit-on-primary)'} transform="translate(32 33)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} rx="7" ry="14" transform={`rotate(${deg}) translate(0 -9)`} opacity={deg ? 0.85 : 1} />
        ))}
        <circle r="4.5" fill="var(--kit-accent)" />
      </g>
    </svg>
  );
}
