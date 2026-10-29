import { useEffect, useId, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  MaskedValue,
  Skeleton,
  useAnnounce,
  useKit,
  type Column,
} from '@nisakhantalib/my-ui-kit';
import { useBank } from './bank';
import type { Account, Category, Txn } from './data';
import type { StringKey } from './strings';

function greetingKey(): StringKey {
  const h = new Date().getHours();
  return h < 12 ? 'greetingMorning' : h < 18 ? 'greetingAfternoon' : 'greetingEvening';
}

/** Simulated network latency, so the loading state is part of the design, not an afterthought. */
function useFakeLoad(ms: number) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return ready;
}

export function Overview() {
  const { t, market, accounts, money } = useBank();
  const announce = useAnnounce();
  const ready = useFakeLoad(450);
  const total = accounts.filter((a) => a.kind !== 'card').reduce((sum, a) => sum + a.balance, 0);

  useEffect(() => {
    if (ready) announce(t('loaded'));
  }, [ready, announce, t]);

  return (
    // minmax(0,1fr): without it the wide table stretches the implicit column past a 320px screen.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div>
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none sm:text-4xl">
          {t(greetingKey(), { name: market.customer })}
        </h1>
        <p className="mt-1 text-muted">{t('overviewIntro')}</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          {/* aria-busy while loading: screen readers wait, then hear "Accounts loaded". */}
          <section aria-labelledby="total-heading" aria-busy={!ready} className="hero-card rounded-card p-6 sm:p-8">
            <h2 id="total-heading" className="text-sm font-semibold tracking-wide uppercase opacity-90">
              {t('totalBalance')}
            </h2>
            {ready ? (
              <p className="money fade-in mt-2 text-4xl font-bold sm:text-5xl">{money(total)}</p>
            ) : (
              <Skeleton width="14rem" className="mt-3 opacity-60 [&_.kit-skeleton]:h-11" />
            )}
            <p className="mt-2 text-sm opacity-90">
              {t('acrossAccounts')} · {t('updated')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => (location.hash = '#/pay')} trackId="hero-pay">
                {t('payCta')}
              </Button>
            </div>
          </section>

          <section aria-labelledby="accounts-heading" aria-busy={!ready}>
            <h2 id="accounts-heading" className="mb-3 text-xl font-bold">
              {t('accounts')}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {accounts.map((a) => (
                <li key={a.id} className="card p-5">
                  {ready ? <AccountCard account={a} /> : <Skeleton lines={3} />}
                </li>
              ))}
            </ul>
          </section>

          <Transactions ready={ready} />
        </div>

        <Spending ready={ready} />
      </div>
    </div>
  );
}

function AccountCard({ account }: { account: Account }) {
  const { t, money } = useBank();
  const isCard = account.kind === 'card';
  return (
    <div className="fade-in grid gap-1">
      <h3 className="font-semibold">{t(account.kind)}</h3>
      <div className="text-sm text-muted">
        <MaskedValue value={account.number} label={t(isCard ? 'cardNumber' : 'accountNumber')} />
      </div>
      <p className="mt-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {t(isCard ? 'outstanding' : 'available')}
      </p>
      <p className="money text-xl font-bold">{money(Math.abs(account.balance))}</p>
    </div>
  );
}

function Transactions({ ready }: { ready: boolean }) {
  const { t, txns, money } = useBank();
  const kit = useKit();
  const columns: Column<Txn>[] = [
    {
      key: 'date',
      header: t('date'),
      cell: (x) => kit.formatDate(x.date, { day: 'numeric', month: 'short' }),
      sortValue: (x) => x.date,
    },
    {
      key: 'desc',
      header: t('description'),
      rowHeader: true,
      sortValue: (x) => x.desc,
      cell: (x) => (
        <span className="grid">
          <span>{x.desc}</span>
          <span className="text-sm font-normal text-muted">{t(`cat.${x.category}` as StringKey)}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      cell: (x) => <Badge tone={x.status === 'pending' ? 'warning' : 'success'}>{t(x.status)}</Badge>,
    },
    {
      key: 'amount',
      header: t('amount'),
      align: 'end',
      sortValue: (x) => x.amount,
      // Credits get an explicit "+" so direction isn't shown by colour alone.
      cell: (x) => (
        <span className={`money font-semibold ${x.amount > 0 ? 'text-success' : ''}`}>
          {money(x.amount, { signDisplay: 'exceptZero' })}
        </span>
      ),
    },
  ];
  return (
    <section aria-busy={!ready} className="card p-5">
      {ready ? (
        <DataTable
          caption={t('recent')}
          columns={columns}
          rows={txns}
          getRowKey={(x) => x.id}
          defaultSort={{ key: 'date', direction: 'descending' }}
        />
      ) : (
        <Skeleton lines={6} />
      )}
    </section>
  );
}

function Spending({ ready }: { ready: boolean }) {
  const { t, txns, money } = useBank();
  const [asTable, setAsTable] = useState(false);
  const titleId = useId();
  const descId = useId();

  const rows = useMemo(() => {
    const byCat = new Map<Category, number>();
    for (const x of txns) if (x.amount < 0) byCat.set(x.category, (byCat.get(x.category) ?? 0) - x.amount);
    return [...byCat.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [txns]);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const max = Math.max(1, ...rows.map((r) => r.amount));
  const label = (c: Category) => t(`cat.${c}` as StringKey);

  return (
    <section aria-labelledby={titleId} aria-busy={!ready} className="card h-fit p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id={titleId} className="text-lg font-bold">
          {t('spending')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-3 whitespace-nowrap"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {t('showTable')}
        </Button>
      </div>
      {!ready ? (
        <Skeleton shape="block" />
      ) : (
        <>
          <p id={descId} className="mb-4 text-sm text-muted">
            {t('spendingSummary', { total: money(total), top: rows[0] ? label(rows[0].category) : '—' })}
          </p>
          {asTable ? (
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
            // The chart is one image with a text summary; the exact figures are in the table view and in each bar's label.
            <figure role="img" aria-labelledby={`${titleId} ${descId}`} className="m-0 grid gap-3">
              {rows.map((r, i) => (
                <div key={r.category} className="grid gap-1" aria-hidden="true">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{label(r.category)}</span>
                    <span className="money text-muted">{money(r.amount)}</span>
                  </div>
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2.5 w-full overflow-visible">
                    <rect width="100" height="8" rx="4" fill="var(--kit-surface)" />
                    <rect
                      width={(r.amount / max) * 100}
                      height="8"
                      rx="4"
                      fill={i === 0 ? 'var(--kit-accent)' : 'var(--kit-primary)'}
                      className="origin-left"
                    />
                  </svg>
                </div>
              ))}
            </figure>
          )}
        </>
      )}
    </section>
  );
}
