import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Badge, Money, useKit } from '@nisakhantalib/my-ui-kit';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  Bus,
  Lightbulb,
  ShoppingBag,
  ShoppingCart,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useBank } from './bank';
import type { Category, Txn } from './data';
import type { StringKey } from './strings';

/** Category icons carry more meaning than merchant logos (they still say "Groceries" when the merchant is unknown). */
export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  income: ArrowDownLeft,
  groceries: ShoppingCart,
  dining: UtensilsCrossed,
  transport: Bus,
  bills: Lightbulb,
  shopping: ShoppingBag,
  transfer: ArrowLeftRight,
};

/** One fixed hue per category (chart slots 1–5, colour-blind-safe in this order). Never the only cue: always labelled. */
export const CATEGORY_COLOR: Record<Category, string> = {
  shopping: 'var(--chart-1)',
  groceries: 'var(--chart-2)',
  bills: 'var(--chart-3)',
  dining: 'var(--chart-4)',
  transport: 'var(--chart-5)',
  income: 'var(--kit-success)',
  transfer: 'var(--kit-text-muted)',
};

export function CategoryIcon({ category, size = 40 }: { category: Category; size?: number }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        // A tint of the category's chart colour, with the icon darkened towards the text colour for contrast.
        background: `color-mix(in srgb, ${CATEGORY_COLOR[category]} 14%, transparent)`,
        color: `color-mix(in srgb, ${CATEGORY_COLOR[category]} 70%, var(--kit-text))`,
      }}
    >
      <Icon size={size * 0.45} strokeWidth={2} />
    </span>
  );
}

/** "Rahman bin Ismail" -> "RI": skip lowercase particles (bin, binti, van). CJK names -> first character. */
export function initials(name: string) {
  const words = name.split(/\s+/).filter((w) => /^\p{Lu}/u.test(w));
  return (words.length ? words : [name])
    .map((w) => [...w][0])
    .slice(0, 2)
    .join('');
}

/** Merchant or payee initials, with an optional category dot. Decorative: the name is always beside it. */
export function Monogram({ name, dot, size = 40 }: { name: string; dot?: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="monogram"
      data-dot={dot ? '' : undefined}
      style={{ width: size, height: size, fontSize: size * 0.32, ['--dot' as string]: dot }}
    >
      {initials(name)}
    </span>
  );
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts up to `value` once, the first time `run` is true (the one entrance moment). Integers in,
 * integers out (minor units). Reduced motion, or a later change of value, shows the value at once.
 */
export function useCountUp(value: number, run: boolean, ms = 900) {
  const [shown, setShown] = useState(value);
  const done = useRef(false);
  useEffect(() => {
    if (!run) return;
    if (done.current || reducedMotion()) {
      setShown(value);
      return;
    }
    done.current = true;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const p = Math.min((now - start) / ms, 1);
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, run, ms]);
  return shown;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return <Monogram name={name} size={size} />;
}

let headingFocusPending = false;
/** Called on navigation: the next PageHeader to mount takes focus (covers lazily loaded pages). */
export function requestHeadingFocus() {
  headingFocusPending = true;
}

/** Page title: receives focus on navigation, so screen readers start reading the new page. */
export function PageHeader({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!headingFocusPending) return;
    headingFocusPending = false;
    ref.current?.focus();
  }, []);
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1
          ref={ref}
          tabIndex={-1}
          className="text-[1.75rem] leading-tight font-semibold tracking-tight outline-none sm:text-[2rem]"
        >
          {title}
        </h1>
        {intro && <p className="mt-1 text-muted">{intro}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = '',
  busy,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  busy?: boolean;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={title ? id : undefined}
      aria-busy={busy || undefined}
      className={`card p-5 sm:p-6 ${className}`}
    >
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** "Today", "Yesterday", or "Mon, 27 Oct" in the market's language. */
export function useDayLabel() {
  const { t } = useBank();
  const kit = useKit();
  return (iso: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (iso === today) return t('today');
    if (iso === yesterday) return t('yesterday');
    return kit.formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short' });
  };
}

/**
 * A headline amount with the cents de-emphasised (kit Money), or "Hidden" while balances are
 * hidden. For lists, the plain `money()` string reads better at small sizes.
 */
export function Amount({
  value,
  signDisplay,
  className,
}: {
  value: number;
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
  className?: string;
}) {
  const { t, hideBalances, market } = useBank();
  if (hideBalances) return <span className={className}>{t('hidden')}</span>;
  return <Money value={value} currency={market.currency} signDisplay={signDisplay} className={className} />;
}

/**
 * One transaction: what, which category, status, how much. Credits get "+" and colour, never
 * colour alone. With `onSelect` the whole row is one button that opens the details.
 */
export function TxnRow({ txn, onSelect }: { txn: Txn; onSelect?: (txn: Txn) => void }) {
  const { t, money, card } = useBank();
  const lastFour = card.number.slice(-4);
  const content = (
    <>
      <Monogram name={txn.desc} dot={CATEGORY_COLOR[txn.category]} />
      <span className="grid min-w-0 flex-1">
        <span className="truncate font-medium">{txn.desc}</span>
        <span className="flex items-center gap-2 text-sm text-muted">
          {t(`cat.${txn.category}` as StringKey)}
          {txn.account === 'card' && <span className="serial text-xs">··{lastFour}</span>}
          {txn.status === 'pending' && <Badge tone="warning">{t('pending')}</Badge>}
        </span>
      </span>
      <span className={`money shrink-0 font-semibold ${txn.amount > 0 ? 'text-success' : ''}`}>
        {money(txn.amount, { signDisplay: 'exceptZero' })}
      </span>
    </>
  );
  if (!onSelect) return <div className="flex items-center gap-3 py-3">{content}</div>;
  return (
    <button
      type="button"
      onClick={() => onSelect(txn)}
      className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface"
    >
      {content}
    </button>
  );
}

/**
 * Donut chart drawn with SVG strokes. It is one labelled image (role="img" + summary text); the
 * legend beside it carries every value as text, so nothing depends on telling colours apart.
 */
export function Donut({ slices, label }: { slices: { key: string; value: number; color: string }[]; label: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 15.9155; // circumference 100, so dash lengths are percentages
  // Each segment starts where the previous ones end; 25 puts the first at 12 o'clock.
  const segments = slices.map((s, i) => ({
    ...s,
    pct: (s.value / total) * 100,
    offset: 25 - slices.slice(0, i).reduce((sum, x) => sum + (x.value / total) * 100, 0),
  }));
  return (
    <svg viewBox="0 0 42 42" role="img" aria-label={label} className="size-36 shrink-0">
      <circle cx="21" cy="21" r={r} fill="none" stroke="var(--kit-surface)" strokeWidth="6" />
      {segments.map((s) => {
        const visible = Math.max(s.pct - 0.8, 0); // small gap between segments
        return (
          <circle
            key={s.key}
            cx="21"
            cy="21"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="6"
            strokeDasharray={`${visible} ${100 - visible}`}
            strokeDashoffset={s.offset}
          />
        );
      })}
    </svg>
  );
}

/** Balance trend line. Decorative: the change is stated in text next to it. */
export function Sparkline({ points, className = '' }: { points: number[]; className?: string }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p - min) / span) * 26}`).join(' ');
  const id = useId();
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,30 ${d} 100,30`} fill={`url(#${id})`} />
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
