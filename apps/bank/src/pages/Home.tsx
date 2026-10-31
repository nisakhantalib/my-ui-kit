import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, DataTable, MaskedValue, Skeleton, useAnnounce, useKit } from '@nisakhantalib/my-ui-kit';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  FileText,
  Lightbulb,
  PiggyBank,
  SlidersHorizontal,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useBank } from '../bank';
import { SPEND_CATEGORIES, type Account } from '../data';
import { href } from '../router';
import type { StringKey } from '../strings';
import { CATEGORY_COLOR, Donut, PageHeader, Panel, Sparkline, TxnRow } from '../ui';

function greetingKey(): StringKey {
  const h = new Date().getHours();
  return h < 12 ? 'greetingMorning' : h < 18 ? 'greetingAfternoon' : 'greetingEvening';
}

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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <BalanceHero ready={ready} />
          <QuickActions />
          <Accounts ready={ready} />
          <Panel
            title={t('recentActivity')}
            busy={!ready}
            action={
              <a
                href={href('activity')}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand"
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
                    <TxnRow txn={x} />
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton lines={5} />
            )}
          </Panel>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <Spending ready={ready} />
          <Bills />
        </div>
      </div>
    </div>
  );
}

function BalanceHero({ ready }: { ready: boolean }) {
  const { t, accounts, history, money, hideBalances } = useBank();
  const kit = useKit();
  const total = accounts.filter((a) => a.id !== 'card').reduce((s, a) => s + a.balance, 0);
  const start = history[0] ?? total;
  const change = (total - start) / Math.abs(start || 1);
  const changeText = new Intl.NumberFormat(kit.locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(change);

  return (
    <section
      aria-labelledby="total-heading"
      aria-busy={!ready}
      className="hero-card relative overflow-hidden rounded-card"
    >
      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="total-heading" className="text-sm font-medium opacity-90">
            {t('totalBalance')}
          </h2>
          {!hideBalances && ready && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
              <ArrowUpRight aria-hidden="true" size={14} />
              {t('changeThisMonth', { change: changeText })}
            </span>
          )}
        </div>
        {ready ? (
          <p className="money fade-in mt-2 text-[2.5rem] leading-tight font-semibold tracking-tight sm:text-5xl">
            {money(total)}
          </p>
        ) : (
          <Skeleton width="15rem" className="mt-3 opacity-50 [&_.kit-skeleton]:h-12" />
        )}
        <p className="mt-1 text-sm opacity-85">{t('acrossAccounts')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => (location.hash = href('pay'))} trackId="hero-transfer">
            <ArrowLeftRight aria-hidden="true" size={18} />
            {t('qa.transfer')}
          </Button>
        </div>
      </div>
      {!hideBalances && <Sparkline points={history} className="absolute inset-x-0 bottom-0 h-24 w-full opacity-60" />}
    </section>
  );
}

function QuickActions() {
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
    { icon: SlidersHorizontal, label: t('qa.settings'), to: href('settings') },
  ];
  return (
    <Panel title={t('quickActions')}>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {actions.map(({ icon: Icon, label, to }) => (
          <li key={label}>
            <a
              href={to}
              className="flex min-h-24 flex-col items-center justify-start gap-2 rounded-2xl p-2 text-center text-[0.8125rem] leading-snug font-medium transition-colors hover:bg-surface"
            >
              <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                <Icon size={22} />
              </span>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const ACCOUNT_ICON: Record<Account['id'], LucideIcon> = { everyday: Wallet, savings: PiggyBank, card: CreditCard };

function Accounts({ ready }: { ready: boolean }) {
  const { t, accounts, money, cardState } = useBank();
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
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-brand"
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
                  <p className="money text-lg font-semibold">{money(Math.abs(a.balance))}</p>
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

function Spending({ ready }: { ready: boolean }) {
  const { t, txns, money } = useBank();
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

  return (
    <Panel
      title={t('spending')}
      busy={!ready}
      action={
        <Button
          variant="ghost"
          size="sm"
          className="-mr-3"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {t('showTable')}
        </Button>
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
            <ul className="grid min-w-40 flex-1 gap-2 text-sm" aria-hidden="true">
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
                className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"
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
                  className="inline-flex min-h-8 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline"
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
