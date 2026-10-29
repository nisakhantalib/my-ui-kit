/** Orchid mark: five petals. Decorative; the brand name next to it is the accessible text. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="orchid-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--kit-primary)" />
          <stop offset="1" stopColor="var(--kit-accent)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#orchid-logo)" />
      <g fill="var(--kit-on-primary)" transform="translate(32 33)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} rx="7" ry="14" transform={`rotate(${deg}) translate(0 -9)`} opacity={deg ? 0.85 : 1} />
        ))}
        <circle r="4.5" fill="var(--kit-accent)" />
      </g>
    </svg>
  );
}
