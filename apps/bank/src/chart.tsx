import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';

interface AreaChartProps {
  values: number[];
  dates: Date[];
  /** Accessible name, e.g. "Balance history". */
  label: string;
  /** How to explore it, read after the name. */
  hint: string;
  formatValue: (value: number) => string;
  formatDate: (date: Date) => string;
  /** Short axis label for a date. */
  formatTick: (date: Date) => string;
}

const clamp = (i: number, n: number) => Math.min(n - 1, Math.max(0, i));

/**
 * Balance area chart that reads like a banking dashboard: hover or drag for the value on a day.
 * For keyboard and screen-reader users it is an ARIA slider over the days: arrow keys step a day,
 * Page Up/Down a week, Home/End jump to the ends, and each step announces "date: balance".
 * The full figures are also available as a table next to it (the caller's toggle).
 */
export function AreaChart({ values, dates, label, hint, formatValue, formatDate, formatTick }: AreaChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();
  const hintId = useId();
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.2 || 1;
  const lo = min - pad;
  const hi = max + pad * 0.5;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;
  const line = values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const current = active ?? n - 1;

  function onKeyDown(e: KeyboardEvent) {
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -7,
      PageUp: 7,
      Home: -n,
      End: n,
    };
    if (!(e.key in step)) return;
    e.preventDefault();
    setActive((i) => clamp((i ?? n - 1) + step[e.key]!, n));
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    setActive(clamp(Math.round(((e.clientX - box.left) / box.width) * (n - 1)), n));
  }

  const tipX = active === null ? 0 : x(active);
  const ticks = [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-describedby={hintId}
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={current}
        aria-valuetext={`${formatDate(dates[current]!)}: ${formatValue(values[current]!)}`}
        onKeyDown={onKeyDown}
        onFocus={() => setActive(n - 1)}
        onBlur={() => setActive(null)}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
        className="area-chart relative h-36 cursor-crosshair touch-pan-y sm:h-52"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--kit-accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--kit-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[25, 50, 75].map((g) => (
            <line
              key={g}
              x1="0"
              x2="100"
              y1={g}
              y2={g}
              className="area-chart__grid"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <polygon points={`0,100 ${line} 100,100`} fill={`url(#${gradientId})`} />
          <polyline
            points={line}
            fill="none"
            stroke="var(--kit-accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {active !== null && (
            <line
              x1={tipX}
              x2={tipX}
              y1="0"
              y2="100"
              className="area-chart__cursor"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {active !== null && (
          <>
            <span
              aria-hidden="true"
              className="area-chart__dot"
              style={{ left: `${tipX}%`, top: `${y(values[active]!)}%` }}
            />
            <span
              aria-hidden="true"
              className="area-chart__tip"
              style={{
                left: `${tipX}%`,
                transform: `translateX(${tipX < 18 ? '0' : tipX > 82 ? '-100%' : '-50%'})`,
              }}
            >
              <span className="block text-xs text-muted">{formatDate(dates[active]!)}</span>
              <span className="money block font-semibold">{formatValue(values[active]!)}</span>
            </span>
          </>
        )}
      </div>
      <p id={hintId} className="sr-only">
        {hint}
      </p>
      <div aria-hidden="true" className="mt-2 flex justify-between text-xs text-muted">
        {ticks.map((i) => (
          <span key={i}>{formatTick(dates[i]!)}</span>
        ))}
      </div>
    </div>
  );
}
