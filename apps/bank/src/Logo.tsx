// The mark is one engraved ring (a hypotrochoid, the curve behind banknote guilloché), computed once.
const RING = (() => {
  const [R, r, d] = [120, 45, 70];
  const k = (R - r) / r;
  let path = '';
  for (let i = 0; i <= 720; i++) {
    const t = (i / 720) * Math.PI * 2 * 3; // r / gcd(R, r) = 3 turns to close
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    path += `${i ? 'L' : 'M'}${(x / 7.2).toFixed(2)} ${(y / 7.2).toFixed(2)}`;
  }
  return path;
})();

/** Orchid mark: an engraved rosette on the brand tile. Decorative; the brand name next to it is the accessible text. */
export function Logo({
  size = 32,
  onBrand = false,
}: {
  size?: number;
  /** On a brand-surface background: a light tile. */ onBrand?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect
        width="64"
        height="64"
        rx="18"
        fill={onBrand ? 'var(--kit-on-brand-surface)' : 'var(--kit-brand-surface)'}
      />
      <path
        d={RING}
        transform="translate(32 32)"
        fill="none"
        stroke={onBrand ? 'var(--kit-brand-surface)' : 'var(--kit-brand-accent)'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3.2" fill={onBrand ? 'var(--kit-brand-surface)' : 'var(--kit-brand-accent)'} />
    </svg>
  );
}
