import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  IconButton,
  MaskedValue,
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
  ChevronRight,
  CreditCard,
  FileText,
  House,
  Lightbulb,
  PiggyBank,
  Plane,
  Table2,
  TrendingDown,
  TrendingUp,
  Umbrella,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useBank } from '../bank';
import { AreaChart } from '../chart';
import { SPEND_CATEGORIES, type Account, type Goal } from '../data';
import { href } from '../router';
import type { StringKey } from '../strings';
import { useOpenTxn } from '../TxnSheet';
import { Amount, CATEGORY_COLOR, Donut, PageHeader, Panel, TxnRow } from '../ui';

function greetingKey(): StringKey {
  const h = new Date().getHours();
  return h < 12 ? 'greetingMorning' : h < 18 ? 'greetingAfternoon' : 'greetingEvening';
}

const percent = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value);

/** Simulated network latency, so the loading state is designed rather than an afterthought. */
function useFakeLoad(ms: number) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return ready;
}

export function Home() {
  const { t, market, txns } = useBank();
  const kit = useKit();
  const announce = useAnnounce();
  const openTxn = useOpenTxn();
  const ready = useFakeLoad(450);

  useEffect(() => {
    if (ready) announce(t('loaded'));
  }, [ready, announce, t]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title={t(greetingKey(), { name: market.customer })}
        intro={kit.formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
      />
      <ActionChips />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <BalancePanel ready={ready} />
          <Accounts ready={ready} />
          <Panel
            title={t('recentActivity')}
            busy={!ready}
            action={
              <a
                href={href('activity')}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link hover:underline underline-offset-4"
              >
                {t('seeAll')}
                <ChevronRight aria-hidden="true" size={16} />
              </a>
            }
          >
            {ready ? (
              <ul className="divide-y divide-line/20">
                {txns.slice(0, 5).map((x) => (
                  <li key={x.id}>
                    <TxnRow txn={x} onSelect={openTxn} />
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton lines={5} />
            )}
          </Panel>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <CreditWidget ready={ready} />
          <Spending ready={ready} />
          <Goals ready={ready} />
          <Bills />
        </div>
      </div>
    </div>
  );
}

/** Mercury-style action chips: the five things people come to do, one tap from the greeting. */
function ActionChips() {
  const { t, market, bills } = useBank();
  const utility = bills.find((b) => b.payeeId !== 'card');
  const actions: { icon: LucideIcon; label: string; to: string }[] = [
    { icon: ArrowLeftRight, label: t('qa.transfer'), to: href('pay') },
    { icon: Zap, label: t('qa.rail', { rail: market.rail }), to: href('pay') },
    {
      icon: Lightbulb,
      label: t('qa.bills'),
      to: utility ? href('pay', { to: utility.payeeId, amount: utility.amount }) : href('pay'),
    },
    { icon: CreditCard, label: t('qa.cards'), to: href('cards') },
    { icon: FileText, label: t('qa.statements'), to: href('activity') },
  ];
  return (
    <nav aria-label={t('quickActions')} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {actions.map(({ icon: Icon, label, to }, i) => (
          <li key={label}>
            <a href={to} className={`chip ${i === 0 ? 'chip--primary' : ''}`}>
              <Icon aria-hidden="true" size={17} strokeWidth={2.2} />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const RANGES = [7, 30, 90, 365] as const;
type Range = (typeof RANGES)[number];

function BalancePanel({ ready }: { ready: boolean }) {
  const { t, accounts, history, money, hideBalances } = useBank();
  const kit = useKit();
  const [range, setRange] = useState<Range>(30);
  const [asTable, setAsTable] = useState(false);

  const total = accounts.filter((a) => a.id !== 'card').reduce((s, a) => s + a.balance, 0);
  const [today] = useState(() => new Date());
  const values = history.slice(-range);
  const dates = values.map(
    (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - (values.length - 1 - i)),
  );
  // Money in and out over the period, from the day-to-day movements behind the chart.
  let moneyIn = 0;
  let moneyOut = 0;
  for (let i = 1; i < values.length; i++) {
    const diff = values[i]! - values[i - 1]!;
    if (diff > 0) moneyIn += diff;
    else moneyOut -= diff;
  }
  const change = (total - values[0]!) / Math.abs(values[0] || 1);
  const changeText = new Intl.NumberFormat(kit.locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(change);
  const longDate = (d: Date) =>
    kit.formatDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const tick = (d: Date) =>
    kit.formatDate(d, range === 365 ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' });
  const tableRows = values
    .map((v, i) => ({ date: dates[i]!, value: v }))
    .filter((_, i) => (values.length - 1 - i) % Math.ceil(values.length / 8) === 0);
  const Trend = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <section aria-labelledby="total-heading" aria-busy={!ready} className="card p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="total-heading" className="text-sm font-medium text-muted">
            {t('totalBalance')}
          </h2>
          {ready ? (
            <p className="fade-in mt-1.5 text-[2.5rem] leading-none font-semibold tracking-[-0.03em] sm:text-[3.25rem]">
              <Amount value={total} />
            </p>
          ) : (
            <Skeleton width="16rem" className="mt-2 [&_.kit-skeleton]:h-12" />
          )}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {/* Hidden balances hide the trend too: a percentage or a line still gives the figures away. */}
            {!hideBalances && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 font-semibold text-ink">
                <Trend aria-hidden="true" size={14} className={change >= 0 ? 'text-success' : 'text-danger'} />
                {changeText}
              </span>
            )}
            {t('acrossAccounts')}
          </p>
        </div>
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

      <div className="mt-6">
        {!ready ? (
          <Skeleton shape="block" className="[&_.kit-skeleton]:h-52" />
        ) : hideBalances ? (
          <p className="grid h-44 place-items-center rounded-xl bg-surface text-muted sm:h-52">{t('hidden')}</p>
        ) : asTable ? (
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
        ) : (
          <AreaChart
            values={values}
            dates={dates}
            label={t('balanceHistory')}
            hint={t('chartHint')}
            formatValue={money}
            formatDate={longDate}
            formatTick={tick}
          />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line/20 pt-5">
        <InOut icon={ArrowDownLeft} label={t('moneyIn')} value={money(moneyIn)} tone="in" />
        <InOut icon={ArrowUpRight} label={t('moneyOut')} value={money(moneyOut)} tone="out" />
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto -mr-3"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {t('showTable')}
        </Button>
      </div>
    </section>
  );
}

function InOut({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'in' | 'out';
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`grid size-9 place-items-center rounded-full ${tone === 'in' ? 'bg-success/12 text-success' : 'bg-surface text-muted'}`}
      >
        <Icon size={17} />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="money font-semibold">{value}</p>
      </div>
    </div>
  );
}

const ACCOUNT_ICON: Record<Account['id'], LucideIcon> = { everyday: Wallet, savings: PiggyBank, card: CreditCard };

function Accounts({ ready }: { ready: boolean }) {
  const { t, accounts, cardState } = useBank();
  return (
    <Panel title={t('accounts')} busy={!ready}>
      {ready ? (
        <ul className="divide-y divide-line/20">
          {accounts.map((a) => {
            const Icon = ACCOUNT_ICON[a.id];
            const isCard = a.id === 'card';
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/8 text-brand"
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 font-medium">
                    {isCard ? (
                      <a href={href('cards')} className="underline-offset-4 hover:underline">
                        {t('card')}
                      </a>
                    ) : (
                      t(a.id)
                    )}
                    {isCard && cardState !== 'active' && (
                      <Badge tone={cardState === 'blocked' ? 'danger' : 'info'}>
                        {t(cardState === 'blocked' ? 'blocked' : 'frozen')}
                      </Badge>
                    )}
                  </h3>
                  <div className="text-sm text-muted">
                    <MaskedValue value={a.number} label={t(isCard ? 'cardNumber' : 'accountNumber')} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="money text-lg font-semibold">
                    <Amount value={Math.abs(a.balance)} />
                  </p>
                  <p className="text-xs text-muted">{t(isCard ? 'outstanding' : 'available')}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Skeleton lines={6} />
      )}
    </Panel>
  );
}

/** Credit at a glance: one stacked bar for posted, pending and available, each also given as text. */
function CreditWidget({ ready }: { ready: boolean }) {
  const { t, accounts, txns, card, cardState, money } = useBank();
  const owed = Math.abs(accounts.find((a) => a.id === 'card')?.balance ?? 0);
  const pending = txns.filter((x) => x.account === 'card' && x.status === 'pending').reduce((s, x) => s - x.amount, 0);
  const posted = Math.max(owed - pending, 0);
  const available = Math.max(card.limit - owed, 0);
  const parts = [
    { key: 'postedLabel' as const, value: posted, className: 'bg-brand' },
    { key: 'pending' as const, value: pending, className: 'bg-brand/45' },
    { key: 'availableCredit' as const, value: available, className: 'bg-line/25' },
  ];
  return (
    <Panel
      title={t('cardShort')}
      busy={!ready}
      action={
        <a
          href={href('cards')}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link hover:underline underline-offset-4"
          aria-label={`${t('viewCard')}: ${t('cardShort')}`}
        >
          {t('viewCard')}
          <ChevronRight aria-hidden="true" size={16} />
        </a>
      }
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="credit-card mini-card relative overflow-hidden" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{t('creditBalance')}</p>
          {ready ? (
            <p className="money text-2xl font-semibold tracking-tight">
              <Amount value={owed} />
            </p>
          ) : (
            <Skeleton width="8rem" />
          )}
        </div>
        {cardState !== 'active' && (
          <Badge tone={cardState === 'blocked' ? 'danger' : 'info'}>
            {t(cardState === 'blocked' ? 'blocked' : 'frozen')}
          </Badge>
        )}
      </div>
      <div aria-hidden="true" className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {parts.map((p) => (
          <span key={p.key} className={p.className} style={{ flexGrow: p.value, minWidth: p.value ? 4 : 0 }} />
        ))}
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-2.5 rounded-full ${p.className}`} />
            <dt className="flex-1 text-muted">{t(p.key)}</dt>
            <dd className="money font-medium">{money(p.value)}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

const GOAL_ICON: Record<Goal['id'], LucideIcon> = { travel: Plane, home: House, safety: Umbrella };

/** Monzo-style pots: what the savings are for, and how close each one is. */
function Goals({ ready }: { ready: boolean }) {
  const { t, goals, money } = useBank();
  const kit = useKit();
  const pct = (g: Goal) => Math.min(g.saved / g.target, 1);
  return (
    <Panel title={t('goals')} busy={!ready}>
      <ul className="grid gap-5">
        {goals.map((g) => {
          const Icon = GOAL_ICON[g.id];
          return (
            <li key={g.id} className="grid gap-2">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent"
                >
                  <Icon size={17} />
                </span>
                <p className="min-w-0 flex-1 truncate font-medium">{t(`goal.${g.id}` as StringKey)}</p>
                <p className="text-sm font-semibold">{t('goalPct', { pct: percent(kit.locale, pct(g)) })}</p>
              </div>
              <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line/20">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct(g) * 100}%` }} />
              </div>
              <p className="money text-xs text-muted">
                {t('goalOf', { saved: money(g.saved), target: money(g.target) })}
              </p>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function Spending({ ready }: { ready: boolean }) {
  const { t, txns, money, lastMonth } = useBank();
  const kit = useKit();
  const [asTable, setAsTable] = useState(false);
  const rows = useMemo(() => {
    const sums = new Map<string, number>();
    for (const x of txns)
      if (x.amount < 0 && (SPEND_CATEGORIES as string[]).includes(x.category))
        sums.set(x.category, (sums.get(x.category) ?? 0) - x.amount);
    return SPEND_CATEGORIES.filter((c) => sums.has(c))
      .map((c) => ({ category: c, amount: sums.get(c)! }))
      .sort((a, b) => b.amount - a.amount);
  }, [txns]);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const label = (c: string) => t(`cat.${c}` as StringKey);
  const summary = t('spendingSummary', { total: money(total), top: rows[0] ? label(rows[0].category) : '—' });
  // The category that moved most against last month, as a plain-language insight.
  const insight = rows
    .map((r) => ({ ...r, change: lastMonth[r.category] ? r.amount / lastMonth[r.category]! - 1 : 0 }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

  return (
    <Panel
      title={t('spending')}
      busy={!ready}
      action={
        <IconButton
          label={t('showTable')}
          size="sm"
          className="-my-2 -mr-2"
          aria-pressed={asTable}
          icon={<Table2 />}
          onClick={() => setAsTable((v) => !v)}
        />
      }
    >
      {!ready ? (
        <Skeleton shape="block" />
      ) : asTable ? (
        <DataTable
          caption={t('spending')}
          captionHidden
          columns={[
            { key: 'c', header: t('category'), cell: (r) => label(r.category), rowHeader: true },
            { key: 'a', header: t('amount'), cell: (r) => money(r.amount), align: 'end' },
          ]}
          rows={rows}
          getRowKey={(r) => r.category}
        />
      ) : (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Donut
              label={summary}
              slices={rows.map((r) => ({ key: r.category, value: r.amount, color: CATEGORY_COLOR[r.category] }))}
            />
            <ul className="grid min-w-36 flex-1 gap-2 text-sm" aria-hidden="true">
              {rows.map((r) => (
                <li key={r.category} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[r.category] }} />
                  <span className="flex-1 truncate">{label(r.category)}</span>
                  <span className="money text-muted">{Math.round((r.amount / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted">{summary}</p>
        </div>
      )}
      {ready && insight && Math.abs(insight.change) >= 0.05 && (
        <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface p-3 text-sm">
          {insight.change < 0 ? (
            <TrendingDown aria-hidden="true" size={18} className="mt-px shrink-0 text-success" />
          ) : (
            <TrendingUp aria-hidden="true" size={18} className="mt-px shrink-0 text-muted" />
          )}
          {t(insight.change < 0 ? 'insightLower' : 'insightHigher', {
            category: label(insight.category),
            pct: percent(kit.locale, Math.abs(insight.change)),
          })}
        </p>
      )}
    </Panel>
  );
}

function Bills() {
  const { t, bills, payees, money } = useBank();
  if (bills.length === 0) return null;
  return (
    <Panel title={t('upcomingBills')}>
      <ul className="divide-y divide-line/20">
        {bills.map((b) => {
          const isCard = b.payeeId === 'card';
          const name = isCard ? t('cardShort') : (payees.find((p) => p.id === b.payeeId)?.name ?? '');
          return (
            <li key={b.id} className="flex items-center gap-3 py-3">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/8 text-brand"
              >
                {isCard ? <CreditCard size={18} /> : <Lightbulb size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{name}</p>
                <p className="money text-sm text-muted">{money(b.amount)}</p>
              </div>
              <div className="grid justify-items-end gap-1">
                <Badge tone={b.dueInDays <= 5 ? 'warning' : 'neutral'}>{t('dueIn', { days: b.dueInDays })}</Badge>
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
