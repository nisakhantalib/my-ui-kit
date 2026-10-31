import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  IconButton,
  Select,
  TextField,
  useAnnounce,
  useKit,
  type Column,
} from '@nisakhantalib/my-ui-kit';
import { Download, LayoutList, Table2 } from 'lucide-react';
import { useBank } from '../bank';
import { SPEND_CATEGORIES, type Category, type Txn } from '../data';
import type { StringKey } from '../strings';
import { CategoryIcon, PageHeader, Panel, TxnRow, useDayLabel } from '../ui';

type Direction = 'all' | 'in' | 'out';

export function Activity() {
  const { t, txns, money } = useBank();
  const kit = useKit();
  const announce = useAnnounce();
  const dayLabel = useDayLabel();
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
          {/* Toggle buttons in a labelled group: aria-pressed tells screen readers which filter is on. */}
          <div role="group" aria-label={t('filterLabel')} className="flex flex-wrap gap-2">
            {filters.map(([value, key]) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => setDirection(value)}
                className="min-h-10 rounded-full border border-line/50 px-4 text-sm font-medium transition-colors hover:bg-surface aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-on-brand"
              >
                {t(key)}
              </button>
            ))}
          </div>
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
        <div className="card overflow-hidden">
          {groups.map(([day, items]) => {
            const net = items.reduce((s, x) => s + x.amount, 0);
            return (
              <section key={day} className="px-5 pb-1 sm:px-6">
                <h2 className="-mx-5 flex items-center justify-between bg-surface/70 px-5 py-2.5 text-[0.8125rem] font-semibold text-muted sm:-mx-6 sm:px-6">
                  <span>{dayLabel(day)}</span>
                  <span className="money font-medium">
                    {t('dayTotal', { amount: money(net, { signDisplay: 'exceptZero' }) })}
                  </span>
                </h2>
                <ul className="divide-y divide-line/20">
                  {items.map((x) => (
                    <li key={x.id}>
                      <TxnRow txn={x} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
