import { useId, useState, type KeyboardEvent } from 'react';
import { Dialog } from '@nisakhantalib/my-ui-kit';
import {
  ArrowLeftRight,
  CornerDownLeft,
  CreditCard,
  Eye,
  EyeOff,
  House,
  Moon,
  ReceiptText,
  Search,
  Settings,
  Snowflake,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { Preferences } from './App';
import { useBank } from './bank';
import { navigate, type Page } from './router';
import type { StringKey } from './strings';
import { useOpenTxn } from './TxnSheet';

interface Item {
  id: string;
  group: 'groupPages' | 'groupActions' | 'groupTxns';
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

const PAGES: [Page, StringKey, LucideIcon][] = [
  ['home', 'nav.home', House],
  ['activity', 'activityTitle', ReceiptText],
  ['pay', 'payTitle', ArrowLeftRight],
  ['cards', 'cardsTitle', CreditCard],
  ['settings', 'settingsTitle', Settings],
];

/**
 * ⌘K / Ctrl+K search over pages, actions and transactions (as in Mercury and Linear). It is the
 * APG combobox pattern: focus stays in the text box, arrow keys move the active option
 * (aria-activedescendant), Enter runs it, and the result count is announced as you type.
 * Mount it only while open, so each opening starts empty.
 */
export function CommandPalette({ onClose, prefs }: { onClose: () => void; prefs: Preferences }) {
  const { t, txns, money, cardState, setCardState, hideBalances, setHideBalances } = useBank();
  const openTxn = useOpenTxn();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const optionId = (i: number) => `${listId}-o${i}`;

  const dark =
    prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const all: Item[] = [
    ...PAGES.map(([page, key, icon]) => ({
      id: `page-${page}`,
      group: 'groupPages' as const,
      label: t(key),
      icon,
      run: () => navigate(page),
    })),
    {
      id: 'hide',
      group: 'groupActions',
      label: t(hideBalances ? 'actShowBalances' : 'hideBalances'),
      icon: hideBalances ? Eye : EyeOff,
      run: () => setHideBalances(!hideBalances),
    },
    ...(cardState === 'blocked'
      ? []
      : [
          {
            id: 'freeze',
            group: 'groupActions' as const,
            label: t(cardState === 'frozen' ? 'actUnfreeze' : 'actFreeze'),
            icon: Snowflake,
            run: () => setCardState(cardState === 'frozen' ? 'active' : 'frozen'),
          },
        ]),
    {
      id: 'theme',
      group: 'groupActions',
      label: t(dark ? 'actLight' : 'actDark'),
      icon: dark ? Sun : Moon,
      run: () => prefs.setTheme(dark ? 'light' : 'dark'),
    },
  ];

  const q = query.trim().toLocaleLowerCase();
  const matches = (text: string) => text.toLocaleLowerCase().includes(q);
  const items: Item[] = [
    ...all.filter((i) => matches(i.label)),
    ...(q
      ? txns
          .filter((x) => matches(x.desc) || matches(t(`cat.${x.category}` as StringKey)))
          .slice(0, 6)
          .map((x) => ({
            id: `txn-${x.id}`,
            group: 'groupTxns' as const,
            label: x.desc,
            hint: money(x.amount, { signDisplay: 'exceptZero' }),
            icon: ReceiptText,
            run: () => openTxn(x),
          }))
      : []),
  ];
  const current = Math.min(active, Math.max(items.length - 1, 0));

  function run(item: Item | undefined) {
    if (!item) return;
    onClose();
    // After the palette has closed and handed focus back, so a sheet opened next returns focus there too.
    setTimeout(item.run);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((current + step + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(items[current]);
    }
  }

  const groups = (['groupPages', 'groupActions', 'groupTxns'] as const)
    .map((g) => ({ g, rows: items.map((item, index) => ({ item, index })).filter((r) => r.item.group === g) }))
    .filter((x) => x.rows.length);

  return (
    <Dialog open onClose={onClose} title={t('commandTitle')}>
      <div className="relative -mx-1">
        <Search aria-hidden="true" size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          role="combobox"
          aria-label={t('commandTitle')}
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={items.length ? optionId(current) : undefined}
          placeholder={t('commandPlaceholder')}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-12 w-full rounded-xl border border-line/40 bg-surface pr-3 pl-10 text-base outline-none focus:border-brand focus:ring-3 focus:ring-[var(--kit-focus)]/40"
        />
      </div>
      <p role="status" className="sr-only">
        {q ? (items.length ? t('commandResults', { count: items.length }) : t('commandEmpty', { q: query })) : ''}
      </p>
      {/* One listbox, grouped: role="group" inside a listbox is the ARIA-sanctioned way to label sections. */}
      <div
        id={listId}
        role="listbox"
        aria-label={t('commandTitle')}
        hidden={!items.length}
        className="-mx-1 mt-3 max-h-[min(24rem,60vh)] overflow-y-auto"
      >
        {groups.map(({ g, rows }) => (
          <div key={g} role="group" aria-labelledby={`${listId}-${g}`} className="py-1">
            <div
              id={`${listId}-${g}`}
              role="presentation"
              className="px-3 py-1.5 text-xs font-semibold text-muted uppercase"
            >
              {t(g)}
            </div>
            {rows.map(({ item, index }) => {
              const Icon = item.icon;
              const selected = index === current;
              return (
                <div
                  key={item.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onClick={() => run(item)}
                  onKeyDown={() => {}}
                  onMouseMove={() => setActive(index)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 ${selected ? 'bg-brand/10 text-ink' : ''}`}
                >
                  <Icon aria-hidden="true" size={18} className={selected ? 'text-brand' : 'text-muted'} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="money text-sm text-muted">{item.hint}</span>}
                  {selected && <CornerDownLeft aria-hidden="true" size={15} className="text-muted" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!items.length && (
        <p aria-hidden="true" className="px-3 py-6 text-center text-muted">
          {t('commandEmpty', { q: query })}
        </p>
      )}
    </Dialog>
  );
}
