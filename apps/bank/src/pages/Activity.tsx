import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  IconButton,
  Radio,
  RadioGroup,
  Select,
  TextField,
  useAnnounce,
  useKit,
  type Column,
} from '@nisakhantalib/my-ui-kit';
import { ArrowDownLeft, ArrowUpRight, Download, LayoutList, PiggyBank, Scale, Table2 } from 'lucide-react';
import { useBank } from '../bank';
import { SPEND_CATEGORIES, type Category, type Txn } from '../data';
import type { StringKey } from '../strings';
import { useOpenTxn } from '../TxnSheet';
import { CATEGORY_COLOR, CategoryIcon, PageHeader, Panel, useDayLabel } from '../ui';

// Recharts loads only with this page.
const CashFlowChart = lazy(() => import('./CashFlowChart').then((m) => ({ default: m.CashFlowChart })));

type Direction = 'all' | 'in' | 'out';

export function Activity() {
  const { t, txns, money, goals, history, hideBalances } = useBank();
  const goal = goals[0];
  const kit = useKit();
  const announce = useAnnounce();
  const dayLabel = useDayLabel();
  const openTxn = useOpenTxn();
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState<Direction>('all');
  const [category, setCategory] = useState<'' | Category>('');
  const [view, setView] = useState<'list' | 'table'>('list');
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return txns.filter((x) => {
      if (direction === 'in' && x.amount < 0) return false;
      if (direction === 'out' && x.amount > 0) return false;
      if (category && x.category !== category) return false;
      if (!q) return true;
      return `${x.desc} ${t(`cat.${x.category}` as StringKey)}`.toLowerCase().includes(q);
    });
  }, [txns, deferredQuery, direction, category, t]);

  // Tell screen-reader users the result count after they stop typing (WCAG 4.1.3).
  useEffect(() => {
    const timer = setTimeout(
      () => announce(results.length ? t('results', { count: results.length }) : t('noResults')),
      500,
    );
    return () => clearTimeout(timer);
  }, [results.length, announce, t]);
  const totals = results.reduce(
    (sum, x) => (x.amount > 0 ? { ...sum, in: sum.in + x.amount } : { ...sum, out: sum.out - x.amount }),
    { in: 0, out: 0 },
  );

  // Six calendar months of money in and out, from the daily balance history.
  const months = useMemo(() => {
    const today = new Date();
    const dayOf = (i: number) =>
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - (history.length - 1 - i));
    return [5, 4, 3, 2, 1, 0].map((k) => {
      const start = new Date(today.getFullYear(), today.getMonth() - k, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - k + 1, 1);
      let moneyIn = 0;
      let moneyOut = 0;
      for (let i = 1; i < history.length; i++) {
        const day = dayOf(i);
        if (day < start || day >= end) continue;
        const diff = history[i]! - history[i - 1]!;
        if (diff > 0) moneyIn += diff;
        else moneyOut -= diff;
      }
      return { label: kit.formatDate(start, { month: 'short' }), moneyIn, moneyOut };
    });
  }, [history, kit]);
  const flowIn = months.reduce((s, m) => s + m.moneyIn, 0);
  const flowOut = months.reduce((s, m) => s + m.moneyOut, 0);

  const groups = useMemo(() => {
    const byDay = new Map<string, Txn[]>();
    for (const x of results) byDay.set(x.date, [...(byDay.get(x.date) ?? []), x]);
    return [...byDay.entries()];
  }, [results]);

  function exportCsv() {
    const header = [t('date'), t('description'), t('category'), t('status'), `${t('amount')} (${kit.currency})`];
    const rows = results.map((x) => [
      x.date,
      x.desc,
      t(`cat.${x.category}` as StringKey),
      t(x.status),
      kit.formatMoney(x.amount, { display: 'none' }).replaceAll(kit.separators.group, ''),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    // BOM so Excel opens Chinese text correctly.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `orchid-bank-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<Txn>[] = [
    { key: 'date', header: t('date'), cell: (x) => dayLabel(x.date), sortValue: (x) => x.date },
    {
      key: 'desc',
      header: t('description'),
      rowHeader: true,
      sortValue: (x) => x.desc,
      cell: (x) => (
        <span className="flex items-center gap-3">
          <CategoryIcon category={x.category} size={32} />
          <span className="grid">
            <span>{x.desc}</span>
            <span className="text-sm font-normal text-muted">{t(`cat.${x.category}` as StringKey)}</span>
          </span>
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
      cell: (x) => (
        <span className={`money font-semibold ${x.amount > 0 ? 'text-success' : ''}`}>
          {money(x.amount, { signDisplay: 'exceptZero' })}
        </span>
      ),
    },
  ];

  const filters: [Direction, StringKey][] = [
    ['all', 'filterAll'],
    ['in', 'filterIn'],
    ['out', 'filterOut'],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title={t('activityTitle')}
        intro={t('activityIntro')}
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={results.length === 0} trackId="activity-export">
            <Download aria-hidden="true" size={18} />
            {t('exportCsv')}
          </Button>
        }
      />

      <Panel>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start">
          <TextField
            type="search"
            label={t('search')}
            hint={t('searchHint')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value as '' | Category)}>
            <option value="">{t('categoryAll')}</option>
            {[...SPEND_CATEGORIES, 'income' as const, 'transfer' as const].map((c) => (
              <option key={c} value={c}>
                {t(`cat.${c}` as StringKey)}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          {/* One choice of three: a native radio group, drawn as a segmented control. */}
          <RadioGroup
            legend={t('filterLabel')}
            legendHidden
            name="direction"
            variant="segmented"
            value={direction}
            onValueChange={(v) => setDirection(v as Direction)}
          >
            {filters.map(([value, key]) => (
              <Radio key={value} value={value} label={t(key)} />
            ))}
          </RadioGroup>
          <div className="flex items-center gap-1">
            <p className="mr-2 text-sm text-muted" aria-hidden="true">
              {t('results', { count: results.length })}
            </p>
            <IconButton
              label={t('viewList')}
              icon={<LayoutList />}
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            />
            <IconButton
              label={t('viewTable')}
              icon={<Table2 />}
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
            />
          </div>
        </div>
      </Panel>

      {/* Mercury-style totals for whatever the filters show. */}
      <section aria-labelledby="activity-summary">
        <h2 id="activity-summary" className="sr-only">
          {t('activitySummary')}
        </h2>
        <dl className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
          {(
            [
              ['moneyIn', totals.in, ArrowDownLeft, 'bg-success/12 text-success'],
              ['moneyOut', totals.out, ArrowUpRight, 'bg-surface text-muted'],
              ['net', totals.in - totals.out, Scale, 'bg-brand/8 text-brand'],
            ] as const
          ).map(([key, value, Icon, tone]) => (
            <div key={key} className="card relative py-4 pr-4 pl-[4.25rem]">
              <dt className="text-sm text-muted">
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 left-4 grid size-10 -translate-y-1/2 place-items-center rounded-full ${tone}`}
                >
                  <Icon size={18} />
                </span>
                {t(key)}
              </dt>
              <dd className="money text-lg font-semibold">
                {money(value, key === 'net' ? { signDisplay: 'exceptZero' } : undefined)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Panel title={t('cashFlow')}>
        {hideBalances ? (
          <p className="grid h-56 place-items-center rounded-xl bg-surface text-muted">{t('hidden')}</p>
        ) : (
          <>
            <Suspense fallback={<div className="h-56" />}>
              <CashFlowChart
                months={months}
                label={t('cashFlowSummary', { in: money(flowIn), out: money(flowOut) })}
                inLabel={t('moneyIn')}
                outLabel={t('moneyOut')}
                format={money}
              />
            </Suspense>
            <p aria-hidden="true" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-[3px] bg-success" />
                {t('moneyIn')} · <span className="money">{money(flowIn)}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-[3px] bg-ink" />
                {t('moneyOut')} · <span className="money">{money(flowOut)}</span>
              </span>
            </p>
          </>
        )}
      </Panel>

      {results.length === 0 ? (
        <Panel>
          <p className="py-10 text-center text-muted">{t('noResults')}</p>
        </Panel>
      ) : view === 'table' ? (
        <Panel>
          <DataTable
            caption={t('activityTitle')}
            captionHidden
            columns={columns}
            rows={results}
            getRowKey={(x) => x.id}
            defaultSort={{ key: 'date', direction: 'descending' }}
          />
        </Panel>
      ) : (
        // Timeline: one rail per day, a dot in each transaction's category colour, and the
        // automatic events (money set aside on payday) shown where they happened.
        <div className="card overflow-hidden">
          {groups.map(([day, items]) => {
            const net = items.reduce((s, x) => s + x.amount, 0);
            return (
              <section key={day} className="px-5 pb-2 sm:px-6">
                <h2 className="-mx-5 flex items-center justify-between bg-surface/70 px-5 py-2.5 font-sans text-[0.8125rem] font-semibold text-muted sm:-mx-6 sm:px-6">
                  <span>{dayLabel(day)}</span>
                  <span className="money font-medium">
                    {t('dayTotal', { amount: money(net, { signDisplay: 'exceptZero' }) })}
                  </span>
                </h2>
                <ol className="timeline">
                  {items.map((x) => (
                    <li key={x.id} className="relative">
                      <span
                        aria-hidden="true"
                        className="timeline__dot"
                        style={{ ['--dot' as string]: CATEGORY_COLOR[x.category] }}
                      />
                      <button
                        type="button"
                        onClick={() => openTxn(x)}
                        className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface"
                      >
                        <span className="grid min-w-0 flex-1">
                          <span className="truncate font-semibold">{x.desc}</span>
                          <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                            <span className="money">{x.time}</span>·<span>{t(`cat.${x.category}` as StringKey)}</span>
                            {x.status === 'pending' && <Badge tone="warning">{t('pending')}</Badge>}
                          </span>
                        </span>
                        <span className={`money shrink-0 font-semibold ${x.amount > 0 ? 'text-success' : ''}`}>
                          {money(x.amount, { signDisplay: 'exceptZero' })}
                        </span>
                      </button>
                      {x.category === 'income' && goal && (
                        <p className="mb-3 flex items-center gap-2.5 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm">
                          <PiggyBank aria-hidden="true" size={17} className="shrink-0 text-success" />
                          {t('autoSaved', {
                            amount: money(Math.round(x.amount * 0.1)),
                            goal: t(`goal.${goal.id}` as StringKey),
                          })}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
