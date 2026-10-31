import { cx } from '../utils.js';

export interface GuillocheProps {
  /** 'rosette': layered engraved rings, as on a banknote. 'waves': interference bands, as on a cheque border. */
  variant?: 'rosette' | 'waves';
  /** Line colour. Defaults to the text colour. */
  color?: string;
  /** Colour of the highlight lines (one ring of the rosette, every fifth wave). */
  accentColor?: string;
  /** Draw the lines in once on mount. Skipped when the user prefers reduced motion. */
  animate?: boolean;
  className?: string;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** A hypotrochoid: the curve a pen traces inside a rolling circle, the basis of engraved security patterns. */
function hypotrochoid(R: number, r: number, d: number, rotation: number, steps = 1600) {
  const k = (R - r) / r;
  const turns = r / gcd(R, r);
  const [cos, sin] = [Math.cos(rotation), Math.sin(rotation)];
  let path = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    path += `${i ? 'L' : 'M'}${(x * cos - y * sin).toFixed(1)} ${(x * sin + y * cos).toFixed(1)}`;
  }
  return path;
}

type Line = { d: string; accent: boolean; opacity: number };

// [R, r, d, rotation, accent, opacity]: integer radii so every curve closes.
const RINGS: [number, number, number, number, boolean, number][] = [
  [210, 75, 120, 0, false, 0.32],
  [180, 66, 96, 0.08, false, 0.18],
  [150, 54, 88, 0.02, false, 0.28],
  [120, 45, 70, 0.06, false, 0.2],
  [96, 36, 56, 0, false, 0.3],
  [64, 24, 40, 0.03, true, 0.5],
];

function waves(): Line[] {
  return Array.from({ length: 26 }, (_, j) => {
    let d = '';
    for (let x = 0; x <= 340; x += 4) {
      const y = 150 + j * 3.2 + 18 * Math.sin(x / 38 + j * 0.22) + 7 * Math.sin(x / 13 - j * 0.4);
      d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
    }
    return { d, accent: j % 5 === 0, opacity: j % 5 === 0 ? 0.55 : 0.22 };
  });
}

// The geometry never changes, so it is computed once per variant and shared by every instance.
const cache = new Map<string, Line[]>();
function lines(variant: 'rosette' | 'waves') {
  let hit = cache.get(variant);
  if (!hit) {
    hit =
      variant === 'waves'
        ? waves()
        : RINGS.map(([R, r, d, rot, accent, opacity]) => ({ d: hypotrochoid(R, r, d, rot), accent, opacity }));
    cache.set(variant, hit);
  }
  return hit;
}

/**
 * Engraved security pattern (guilloché), drawn as deterministic SVG. Decorative only: hidden
 * from assistive technology, no pointer events. Size and position it with `className`.
 */
export function Guilloche({
  variant = 'rosette',
  color = 'currentColor',
  accentColor = color,
  animate = false,
  className,
}: GuillocheProps) {
  const rosette = variant === 'rosette';
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={rosette ? '-260 -260 520 520' : '0 0 340 214'}
      preserveAspectRatio={rosette ? 'xMidYMid meet' : 'none'}
      className={cx('kit-guilloche', animate && 'kit-guilloche--draw', className)}
    >
      {lines(variant).map((l, i) => (
        <path
          key={i}
          d={l.d}
          pathLength={1}
          fill="none"
          stroke={l.accent ? accentColor : color}
          strokeOpacity={l.opacity}
          strokeWidth={rosette ? 1.2 : 0.7}
          style={animate ? { animationDelay: `${i * 70}ms` } : undefined}
        />
      ))}
    </svg>
  );
}
