import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  Badge,
  Button,
  DataTable,
  Guilloche,
  IconButton,
  MaskedValue,
  Money,
  Radio,
  RadioGroup,
  Skeleton,
  useAnnounce,
  useKit,
} from '@nisakhantalib/my-ui-kit';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  QrCode,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useBank } from '../bank';
import { AreaChart } from '../chart';
import { SPEND_CATEGORIES, type Account, type Txn } from '../data';
import { href } from '../router';
import type { StringKey } from '../strings';
import { useOpenTxn } from '../TxnSheet';
import { CATEGORY_COLOR, Monogram, PageHeader, Panel, TxnRow, useCountUp, useDayLabel } from '../ui';

function greetingKey(): StringKey {
  const h = new Date().getHours();
  return h < 12 ? 'greetingMorning' : h < 18 ? 'greetingAfternoon' : 'greetingEvening';
}

const percent = (locale: string, value: number, digits = 0) =>
  new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: digits }).format(value);

/** The demo savings rate, shown on the savings card. */
const SAVINGS_RATE = 0.0285;

/** Simulated network latency, so the loading state is designed rather than an afterthought. */
function useFakeLoad(ms: number) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return ready;
}

const linkClass =
  'inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link underline-offset-4 hover:underline';

export function Home() {
  const { t, market, txns } = useBank();
  const kit = useKit();
  const announce = useAnnounce();
  const ready = useFakeLoad(450);

  useEffect(() => {
    if (ready) announce(t('loaded'));
  }, [ready, announce, t]);

  const [now] = useState(() => Date.now());
  // "Your salary arrived 2 days ago": the context line people check first after payday.
  const salary = txns.find((x) => x.category === 'income');
  const salaryDays = salary ? Math.round((now - new Date(salary.date).getTime()) / 86_400_000) : null;
  const date = kit.formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' });
  const intro =
    salaryDays === null
      ? date
      : `${date} · ${salaryDays <= 0 ? t('salaryToday') : t('salaryDays', { days: salaryDays })}`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-12 xl:gap-6">
      <div className="xl:col-span-12">
        <PageHeader title={t(greetingKey(), { name: market.customer })} intro={intro} />
      </div>
      <AccountStack ready={ready} />
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-5 xl:col-span-4 xl:gap-6">
        <CreditWidget ready={ready} />
        <PayAgain />
      </div>
      <div className="rise xl:col-span-7" style={{ '--i': 3 } as CSSProperties}>
        <Spending ready={ready} />
      </div>
      <div
        className="rise grid grid-cols-[minmax(0,1fr)] content-start gap-5 xl:col-span-5 xl:gap-6"
        style={{ '--i': 4 } as CSSProperties}
      >
        <Bills />
        <Goals ready={ready} />
      </div>
      <div className="rise xl:col-span-7" style={{ '--i': 5 } as CSSProperties}>
        <RecentActivity ready={ready} />
      </div>
      <div className="rise xl:col-span-5" style={{ '--i': 6 } as CSSProperties}>
        <BalanceTrend ready={ready} />
      </div>
    </div>
  );
}

const ORDER: Account['id'][] = ['everyday', 'savings', 'card'];

/**
 * The hero: accounts as a stack of cards (the front one is selected) beside the total balance.
 * The account list doubles as the selector, so the stack is never the only way to reach an account.
 */
function AccountStack({ ready }: { ready: boolean }) {
  const { t, accounts, history, money, hideBalances, market, cardState, card } = useBank();
  const kit = useKit();
  const [active, setActive] = useState(0);
  const byId = (id: Account['id']) => accounts.find((a) => a.id === id)!;
  const total = accounts.filter((a) => a.id !== 'card').reduce((s, a) => s + a.balance, 0);
  const shown = useCountUp(total, ready);
  const change = total - (history.at(-90) ?? total);
  const Trend = change >= 0 ? TrendingUp : TrendingDown;
  const step = (by: number) => setActive((i) => (i + by + ORDER.length) % ORDER.length);
  const name = (id: Account['id']) => t(id === 'card' ? 'card' : id);

  return (
    <section
      aria-labelledby="total-heading"
      aria-busy={!ready}
      className="card rise grid grid-cols-[minmax(0,1fr)] gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-center md:gap-8 xl:col-span-8"
    >
      <div>
        <div className="deck">
          {ORDER.map((id, i) => {
            const pos = (i - active + ORDER.length) % ORDER.length;
            const a = byId(id);
            const front = pos === 0;
            return (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <div
                key={id}
                data-pos={pos}
                className={`acct-card acct-card--${id}`}
                // Back cards are a shortcut for pointer users; keyboard users have the list and buttons.
                onClick={front ? undefined : () => setActive(i)}
                aria-hidden={front ? undefined : true}
                role={front ? 'group' : undefined}
                aria-label={front ? name(id) : undefined}
              >
                {id === 'card' ? (
                  <Guilloche
                    variant="waves"
                    color="var(--kit-brand-accent)"
                    accentColor="#c8a25a"
                    className="inset-0 size-full"
                  />
                ) : (
                  <Guilloche
                    color="var(--kit-brand-accent)"
                    accentColor="#c8a25a"
                    animate={id === 'everyday'}
                    className={`-top-28 -right-28 size-80 ${id === 'savings' ? 'opacity-50' : ''}`}
                  />
                )}
                <p className="flex items-center text-[0.6875rem] font-semibold tracking-[0.1em] uppercase opacity-80">
                  {name(id)}
                  <span className="ml-auto">
                    {id === 'savings'
                      ? t('interestRate', { rate: percent(kit.locale, SAVINGS_RATE, 2) })
                      : t(id === 'card' ? 'credit' : 'debit')}
                  </span>
                </p>
                {id === 'card' && <span aria-hidden="true" className="credit-card__chip mt-3 scale-90 origin-left" />}
                <p className="display mt-auto text-[2rem] leading-none font-semibold sm:text-[2.125rem]">
                  {hideBalances ? t('hidden') : <Money value={a.balance} currency={market.currency} />}
                </p>
                <div className="serial mt-2 flex items-center justify-between text-xs opacity-85">
                  <MaskedValue value={a.number} label={t(id === 'card' ? 'cardNumber' : 'accountNumber')} />
                  {id === 'card' ? (
                    cardState !== 'active' ? (
                      <Badge tone={cardState === 'blocked' ? 'danger' : 'info'}>
                        {t(cardState === 'blocked' ? 'blocked' : 'frozen')}
                      </Badge>
                    ) : (
                      <span>{card.expiry}</span>
                    )
                  ) : (
                    <span>{t('available')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <IconButton label={t('prevAccount')} icon={<ChevronLeft />} size="sm" onClick={() => step(-1)} />
          <span aria-hidden="true" className="flex gap-1.5">
            {ORDER.map((id, i) => (
              <span
                key={id}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-ink' : 'w-1.5 bg-line/40'}`}
              />
            ))}
          </span>
          <IconButton label={t('nextAccount')} icon={<ChevronRight />} size="sm" onClick={() => step(1)} />
        </div>
      </div>

      <div className="min-w-0">
        <h2 id="total-heading" className="font-sans text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          {t('totalBalance')}
        </h2>
        {ready ? (
          <p className="display mt-2 text-[2.5rem] leading-none font-semibold tracking-[-0.03em] sm:text-[3.25rem]">
            {hideBalances ? t('hidden') : <Money value={shown} currency={market.currency} />}
          </p>
        ) : (
          <Skeleton width="16rem" className="mt-2 [&_.kit-skeleton]:h-12" />
        )}
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          {/* Hidden balances hide the trend too: the change still gives the figures away. */}
          {!hideBalances && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-ink ${change >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}
            >
              <Trend aria-hidden="true" size={14} className={change >= 0 ? 'text-success' : 'text-danger'} />
              {money(change, { signDisplay: 'exceptZero' })}
            </span>
          )}
          {t('trend3m')} · {t('acrossAccounts')}
        </p>

        <ul aria-label={t('yourAccounts')} className="mt-5 grid gap-0.5 border-t border-line/20 pt-3">
          {ORDER.map((id, i) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.9375rem] transition-colors hover:bg-surface aria-pressed:bg-surface aria-pressed:font-semibold"
              >
                <span aria-hidden="true" className={`acct-card--${id} size-2.5 rounded-[3px]`} />
                <span className="min-w-0 flex-1 truncate">{name(id)}</span>
                <span className="money font-semibold">{money(byId(id).balance)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ul aria-label={t('quickActions')} className="flex flex-wrap gap-2 border-t border-line/20 pt-5 md:col-span-2">
        <li>
          <a href={href('pay')} className="chip chip--primary">
            <Send aria-hidden="true" size={17} />
            {t('paySomeone')}
          </a>
        </li>
        <li>
          <a href={href('pay')} className="chip">
            <ArrowLeftRight aria-hidden="true" size={17} />
            {t('moveMoney')}
          </a>
        </li>
        <li>
          <a href={href('pay')} className="chip">
            <QrCode aria-hidden="true" size={17} />
            {t('qa.rail', { rail: market.rail })}
          </a>
        </li>
      </ul>
    </section>
  );
}

/** Credit at a glance: how much of the limit is used, and the two things people do next. */
function CreditWidget({ ready }: { ready: boolean }) {
  const { t, accounts, card, cardState, money, bills } = useBank();
  const owed = Math.abs(accounts.find((a) => a.id === 'card')?.balance ?? 0);
  const used = Math.min(owed / card.limit, 1);
  const due = bills.find((b) => b.payeeId === 'card');
  return (
    <div className="rise" style={{ '--i': 1 } as CSSProperties}>
      <Panel
        title={t('cardShort')}
        busy={!ready}
        action={
          <a href={href('cards')} className={linkClass} aria-label={`${t('viewCard')}: ${t('cardShort')}`}>
            {t('viewCard')}
            <ChevronRight aria-hidden="true" size={16} />
          </a>
        }
      >
        {cardState !== 'active' && (
          <Badge tone={cardState === 'blocked' ? 'danger' : 'info'} className="mb-3">
            {t(cardState === 'blocked' ? 'blocked' : 'frozen')}
          </Badge>
        )}
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-line/20">
          <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(used * 100, 2)}%` }} />
        </div>
        <p className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-muted">
          <span>{t('spentLabel', { amount: money(owed) })}</span>
          <span>{t('leftLabel', { amount: money(card.limit - owed) })}</span>
        </p>
        {due && (
          <p className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface px-3.5 py-3 text-sm">
            <span>{t('dueIn', { days: due.dueInDays })}</span>
            <span className="money font-semibold">{money(due.amount)}</span>
          </p>
        )}
      </Panel>
    </div>
  );
}

/** One-tap repeat payments: the people and billers paid most often. */
function PayAgain() {
  const { t, payees } = useBank();
  return (
    <div className="rise" style={{ '--i': 2 } as CSSProperties}>
      <Panel
        title={t('payAgain')}
        action={
          <a href={href('pay')} className={linkClass}>
            {t('allPayees')}
            <ChevronRight aria-hidden="true" size={16} />
          </a>
        }
      >
        <ul className="grid grid-cols-5 gap-1">
          {payees.slice(0, 4).map((p) => (
            <li key={p.id}>
              <a
                href={href('pay', { to: p.id })}
                className="grid justify-items-center gap-1.5 rounded-xl px-1 py-2 text-center text-xs text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <Monogram name={p.name} size={46} />
                <span className="w-full truncate">{p.name.split(/\s+/)[0]}</span>
              </a>
            </li>
          ))}
          <li>
            <a
              href={href('pay')}
              className="grid justify-items-center gap-1.5 rounded-xl px-1 py-2 text-center text-xs text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <span
                aria-hidden="true"
                className="grid size-[46px] place-items-center rounded-full border border-dashed border-line/60"
              >
                <Plus size={18} />
              </span>
              {t('newPayee')}
            </a>
          </li>
        </ul>
      </Panel>
    </div>
  );
}

/** This period's spending: one bar for the mix, then a row per category against last month. */
function Spending({ ready }: { ready: boolean }) {
  const { t, txns, money, lastMonth } = useBank();
  const kit = useKit();
  const rows = useMemo(() => {
    const sums = new Map<string, number>();
    for (const x of txns)
      if (x.amount < 0 && (SPEND_CATEGORIES as string[]).includes(x.category))
        sums.set(x.category, (sums.get(x.category) ?? 0) - x.amount);
    return SPEND_CATEGORIES.filter((c) => sums.has(c))
      .map((c) => ({ category: c, amount: sums.get(c)!, last: lastMonth[c] ?? 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [txns, lastMonth]);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const lastTotal = rows.reduce((s, r) => s + r.last, 0);
  const scale = Math.max(...rows.map((r) => Math.max(r.amount, r.last)), 1) * 1.1;
  const label = (c: string) => t(`cat.${c}` as StringKey);
  const diff = total - lastTotal;
  // The category that moved most against last month, as a plain-language insight.
  const insight = rows
    .map((r) => ({ ...r, change: r.last ? r.amount / r.last - 1 : 0 }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

  return (
    <Panel title={t('spending')} busy={!ready}>
      {!ready ? (
        <Skeleton shape="block" />
      ) : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="money text-[2rem] leading-none font-semibold tracking-tight">{money(total)}</span>
            <span className={`text-sm font-semibold ${diff <= 0 ? 'text-success' : 'text-danger'}`}>
              {t(diff <= 0 ? 'spentLess' : 'spentMore', { amount: money(Math.abs(diff)) })}
            </span>
          </p>
          <div aria-hidden="true" className="mt-5 flex h-3 gap-0.5">
            {rows.map((r) => (
              <span
                key={r.category}
                className="rounded-[3px]"
                style={{ flexGrow: r.amount, background: CATEGORY_COLOR[r.category] }}
              />
            ))}
          </div>
          <ul className="mt-4 divide-y divide-line/15">
            {rows.map((r) => {
              const change = r.last ? r.amount / r.last - 1 : 0;
              return (
                <li
                  key={r.category}
                  className="grid grid-cols-[0.625rem_minmax(0,1fr)_auto_3.25rem] items-center gap-x-3 py-2.5 text-[0.9375rem] sm:grid-cols-[0.625rem_7rem_minmax(0,1fr)_auto_3.25rem]"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-[3px]"
                    style={{ background: CATEGORY_COLOR[r.category] }}
                  />
                  <span className="truncate">{label(r.category)}</span>
                  <span aria-hidden="true" className="compare-bar hidden sm:block">
                    <span style={{ width: `${(r.amount / scale) * 100}%` }} />
                    <i style={{ left: `${(r.last / scale) * 100}%` }} />
                  </span>
                  <span className="money text-right font-semibold">
                    {money(r.amount)}
                    <span className="sr-only"> ({t('lastMonthWas', { amount: money(r.last) })})</span>
                  </span>
                  <span
                    className={`text-right text-[0.8125rem] font-semibold ${change > 0 ? 'text-danger' : 'text-success'}`}
                  >
                    {new Intl.NumberFormat(kit.locale, {
                      style: 'percent',
                      maximumFractionDigits: 0,
                      signDisplay: 'exceptZero',
                    }).format(change)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p aria-hidden="true" className="mt-1 hidden items-center gap-2 text-xs text-muted sm:flex">
            <span className="inline-block h-3 w-0.5 rounded bg-muted" />
            {t('lastMonthMark')}
          </p>
          {insight && Math.abs(insight.change) >= 0.05 && (
            <p className="mt-4 flex items-start gap-3 rounded-xl bg-surface p-3.5 text-sm">
              <Sparkles aria-hidden="true" size={18} className="mt-px shrink-0 text-accent" />
              {t(insight.change < 0 ? 'insightLower' : 'insightHigher', {
                category: label(insight.category),
                pct: percent(kit.locale, Math.abs(insight.change)),
              })}
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

function Bills() {
  const { t, bills, payees, money } = useBank();
  const kit = useKit();
  const [now] = useState(() => Date.now());
  if (bills.length === 0) return null;
  return (
    <Panel title={t('comingUp')}>
      <ul className="grid gap-1">
        {bills.map((b) => {
          const isCard = b.payeeId === 'card';
          const payee = payees.find((p) => p.id === b.payeeId);
          const name = isCard ? t('cardShort') : (payee?.name ?? '');
          const due = new Date(now + b.dueInDays * 86_400_000);
          return (
            <li key={b.id} className="flex items-center gap-3.5 py-2">
              <span className="date-tile" aria-hidden="true">
                <small>{kit.formatDate(due, { month: 'short' })}</small>
                <b>{kit.formatDate(due, { day: 'numeric' })}</b>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{name}</p>
                <p className="truncate text-sm text-muted">{t('dueIn', { days: b.dueInDays })}</p>
              </div>
              <div className="grid justify-items-end">
                <p className="money font-semibold">{money(b.amount)}</p>
                <a
                  href={isCard ? href('cards') : href('pay', { to: b.payeeId, amount: b.amount })}
                  className="inline-flex min-h-8 items-center text-sm font-semibold text-link underline-offset-4 hover:underline"
                  aria-label={`${isCard ? t('viewCard') : t('payBill')}: ${name}`}
                >
                  {isCard ? t('viewCard') : t('payBill')}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Monzo-style pots: what the savings are for, and how close each one is, ruled in tenths. */
function Goals({ ready }: { ready: boolean }) {
  const { t, goals, money } = useBank();
  const kit = useKit();
  return (
    <Panel title={t('goals')} busy={!ready}>
      <ul className="divide-y divide-line/15">
        {goals.map((g) => {
          const pct = Math.min(g.saved / g.target, 1);
          return (
            <li key={g.id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[0.9375rem]">
                <span>
                  <span className="font-semibold">{t(`goal.${g.id}` as StringKey)}</span>
                  <span className="money text-muted"> · {money(g.saved)}</span>
                </span>
                <span className="text-sm text-muted">
                  {t('goalPct', { pct: percent(kit.locale, pct) })} · {money(g.target)}
                </span>
              </p>
              <div aria-hidden="true" className="tick-bar">
                <span style={{ '--p': Math.max(pct, 0.01) } as CSSProperties} />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** The latest transactions, grouped by day with each day's net, as on the Activity page. */
function RecentActivity({ ready }: { ready: boolean }) {
  const { t, txns, money } = useBank();
  const openTxn = useOpenTxn();
  const dayLabel = useDayLabel();
  const groups = useMemo(() => {
    const byDay = new Map<string, Txn[]>();
    for (const x of txns.slice(0, 5)) byDay.set(x.date, [...(byDay.get(x.date) ?? []), x]);
    return [...byDay.entries()];
  }, [txns]);
  return (
    <Panel
      title={t('recentActivity')}
      busy={!ready}
      action={
        <a href={href('activity')} className={linkClass}>
          {t('seeAll')}
          <ChevronRight aria-hidden="true" size={16} />
        </a>
      }
    >
      {ready ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          {groups.map(([day, items]) => (
            <section key={day} aria-label={dayLabel(day)}>
              <h3 className="flex justify-between pt-1 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                <span>{dayLabel(day)}</span>
                <span className="money tracking-normal">
                  {money(
                    items.reduce((s, x) => s + x.amount, 0),
                    { signDisplay: 'exceptZero' },
                  )}
                </span>
              </h3>
              <ul>
                {items.map((x) => (
                  <li key={x.id}>
                    <TxnRow txn={x} onSelect={openTxn} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <Skeleton lines={5} />
      )}
    </Panel>
  );
}

const RANGES = [30, 90, 365] as const;
type Range = (typeof RANGES)[number];

/** Balance over time on the brand surface, with money in and out for the period. */
function BalanceTrend({ ready }: { ready: boolean }) {
  const { t, accounts, history, money, hideBalances } = useBank();
  const kit = useKit();
  const [range, setRange] = useState<Range>(90);
  const [asTable, setAsTable] = useState(false);
  const total = accounts.filter((a) => a.id !== 'card').reduce((s, a) => s + a.balance, 0);
  const [today] = useState(() => new Date());
  const values = history.slice(-range);
  values[values.length - 1] = total;
  const dates = values.map(
    (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - (values.length - 1 - i)),
  );
  let moneyIn = 0;
  let moneyOut = 0;
  for (let i = 1; i < values.length; i++) {
    const diff = values[i]! - values[i - 1]!;
    if (diff > 0) moneyIn += diff;
    else moneyOut -= diff;
  }
  const longDate = (d: Date) =>
    kit.formatDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const tick = (d: Date) =>
    kit.formatDate(d, range === 365 ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' });
  const tableRows = values
    .map((v, i) => ({ date: dates[i]!, value: v }))
    .filter((_, i) => (values.length - 1 - i) % Math.ceil(values.length / 8) === 0);

  return (
    <section
      aria-labelledby="trend-heading"
      aria-busy={!ready}
      className="hero-card brand-panel flex h-full flex-col p-5 sm:p-6"
    >
      <Guilloche
        color="var(--kit-brand-accent)"
        accentColor="#c8a25a"
        className="-top-40 -right-40 size-[26rem] opacity-60"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="trend-heading" className="text-base font-semibold">
          {t('balanceOverTime')}
        </h2>
        <RadioGroup
          legend={t('period')}
          legendHidden
          name="range"
          variant="segmented"
          value={String(range)}
          onValueChange={(v) => setRange(Number(v) as Range)}
        >
          {RANGES.map((r) => (
            <Radio key={r} value={String(r)} label={t(`range.${r}` as StringKey)} />
          ))}
        </RadioGroup>
      </div>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
        <InOut icon={ArrowDownLeft} label={t('moneyIn')} value={money(moneyIn)} />
        <InOut icon={ArrowUpRight} label={t('moneyOut')} value={money(moneyOut)} />
      </dl>
      <div className="mt-auto pt-6">
        {!ready ? (
          <Skeleton shape="block" className="[&_.kit-skeleton]:h-40" />
        ) : hideBalances ? (
          <p className="grid h-40 place-items-center rounded-xl bg-white/8">{t('hidden')}</p>
        ) : asTable ? (
          <div className="rounded-xl bg-bg p-2 text-ink">
            <DataTable
              caption={t('balanceHistory')}
              captionHidden
              columns={[
                { key: 'd', header: t('date'), cell: (r) => longDate(r.date), rowHeader: true },
                { key: 'v', header: t('totalBalance'), cell: (r) => money(r.value), align: 'end' },
              ]}
              rows={tableRows}
              getRowKey={(r) => r.date.toISOString()}
            />
          </div>
        ) : (
          <AreaChart
            values={values}
            dates={dates}
            label={t('balanceHistory')}
            hint={t('chartHint')}
            formatValue={money}
            formatDate={longDate}
            formatTick={tick}
            tone="brand"
          />
        )}
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
          >
            {t('showTable')}
          </Button>
        </div>
      </div>
    </section>
  );
}

function InOut({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  // The icon sits inside the <dt>, so the list keeps the dt/dd structure assistive tech expects.
  return (
    <div className="relative pl-10">
      <dt className="text-xs opacity-80">
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-brand-accent"
        >
          <Icon size={16} />
        </span>
        {label}
      </dt>
      <dd className="money font-semibold">{value}</dd>
    </div>
  );
}
