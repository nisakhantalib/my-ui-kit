import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnalyticsProvider,
  AnnouncerProvider,
  Button,
  Dialog,
  IconButton,
  KitProvider,
  SkipLink,
  ToastProvider,
  adobeDataLayerAdapter,
  consoleAdapter,
  useAnnounce,
  useKit,
  usePageView,
} from '@nisakhantalib/my-ui-kit';
import {
  ArrowLeftRight,
  Bell,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  House,
  Lightbulb,
  LogOut,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Send,
  Settings as SettingsIcon,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { MARKETS, type Market } from './data';
import { BankProvider, useBank } from './bank';
import { href, useRoute, type Page } from './router';
import { Avatar, requestHeadingFocus } from './ui';
import { CommandPalette } from './CommandPalette';
import { Logo } from './Logo';
import { Home } from './pages/Home';
import { SignIn } from './SignIn';
import type { StringKey } from './strings';
import { TxnSheetProvider } from './TxnSheet';

// Less-visited pages load on demand, so Home's first paint ships less JavaScript.
const Activity = lazy(() => import('./pages/Activity').then((m) => ({ default: m.Activity })));
const Pay = lazy(() => import('./pages/Pay').then((m) => ({ default: m.Pay })));
const Cards = lazy(() => import('./pages/Cards').then((m) => ({ default: m.Cards })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

export type Theme = 'system' | 'light' | 'dark';
export type Tier = 'personal' | 'private';

function usePersisted<T extends string | boolean>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved) as T;
    } catch {
      /* storage blocked */
    }
    return initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked: keep in memory */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export interface Preferences {
  market: Market;
  setMarket: (code: Market['code']) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  tier: Tier;
  setTier: (tier: Tier) => void;
  signOut: () => void;
}

export function App() {
  const [marketCode, setMarket] = usePersisted<Market['code']>('market', 'SG');
  const [theme, setTheme] = usePersisted<Theme>('theme', 'system');
  const [tier, setTier] = usePersisted<Tier>('tier', 'personal');
  const [hideBalances, setHideBalances] = usePersisted<boolean>('hide-balances', false);
  const [signedIn, setSignedIn] = usePersisted<boolean>('signed-in', false);
  const market = MARKETS.find((m) => m.code === marketCode) ?? MARKETS[0]!;
  const adapters = useMemo(() => [consoleAdapter, adobeDataLayerAdapter()], []);

  // Theme and brand are attributes on <html>, the same switches every kit consumer uses.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.dataset.brand = tier === 'private' ? 'private' : 'orchid';
    root.lang = market.locale;
  }, [theme, tier, market.locale]);

  const prefs: Preferences = { market, setMarket, theme, setTheme, tier, setTier, signOut: () => setSignedIn(false) };

  return (
    <KitProvider locale={market.locale} currency={market.currency}>
      <AnalyticsProvider adapters={adapters}>
        <AnnouncerProvider>
          <ToastProvider>
            <BankProvider
              key={market.code}
              market={market}
              hideBalances={hideBalances}
              setHideBalances={setHideBalances}
              tier={tier}
            >
              {signedIn ? (
                <TxnSheetProvider>
                  <Shell prefs={prefs} />
                </TxnSheetProvider>
              ) : (
                <SignIn
                  prefs={prefs}
                  onEnter={() => {
                    // The button disappears with the screen: start the user at Home's heading.
                    requestHeadingFocus();
                    setSignedIn(true);
                  }}
                />
              )}
            </BankProvider>
          </ToastProvider>
        </AnnouncerProvider>
      </AnalyticsProvider>
    </KitProvider>
  );
}

const NAV: { page: Page; icon: typeof House; label: StringKey; group: 'banking' | 'you' }[] = [
  { page: 'home', icon: House, label: 'nav.home', group: 'banking' },
  { page: 'activity', icon: ReceiptText, label: 'nav.activity', group: 'banking' },
  { page: 'pay', icon: ArrowLeftRight, label: 'nav.pay', group: 'banking' },
  { page: 'cards', icon: CreditCard, label: 'nav.cards', group: 'banking' },
  { page: 'settings', icon: SettingsIcon, label: 'nav.settings', group: 'you' },
];
/** Phones: four tabs around a central "Move money" button that opens the action sheet. */
const TABS = NAV.filter((n) => n.page !== 'pay');

const TITLES: Record<Page, StringKey> = {
  home: 'nav.home',
  activity: 'activityTitle',
  pay: 'payTitle',
  cards: 'cardsTitle',
  settings: 'settingsTitle',
};

function Shell({ prefs }: { prefs: Preferences }) {
  const { t, market, hideBalances, setHideBalances, tier, money, bills, payees, txns } = useBank();
  const kit = useKit();
  const route = useRoute();
  const mainRef = useRef<HTMLElement>(null);
  const announce = useAnnounce();
  const pageView = usePageView();
  const firstRender = useRef(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

  // Ctrl+K / ⌘K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // Fixed for the session: an hour before the app opened (a real app gets this from the auth server).
  const [signedInAt] = useState(() => new Date(Date.now() - 3_600_000));

  // Single-page navigation: update the title, move focus to the new page's heading and announce
  // it, so screen-reader users know the page changed (there is no page load to tell them).
  useEffect(() => {
    const title = t(TITLES[route.page]);
    document.title = `${title} · ${t('brand')}`;
    pageView(`bank:${route.page}`, { market: market.code });
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    // Pages load lazily, so the heading may not exist yet: PageHeader focuses itself when it mounts.
    requestHeadingFocus();
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus();
    announce(title);
  }, [route.page, t, market.code, pageView, announce]);

  const utility = bills.find((b) => b.payeeId !== 'card');
  const notifications = [
    t('notifSalary', { amount: money(txns.find((x) => x.category === 'income')?.amount ?? 0) }),
    utility &&
      t('notifBill', {
        payee: payees.find((p) => p.id === utility.payeeId)?.name ?? '',
        amount: money(utility.amount),
        days: utility.dueInDays,
      }),
    t('notifSecurity'),
  ].filter(Boolean) as string[];

  const balanceToggle = (
    <IconButton
      label={t('hideBalances')}
      aria-pressed={hideBalances}
      icon={hideBalances ? <EyeOff /> : <Eye />}
      onClick={() => setHideBalances(!hideBalances)}
    />
  );
  const bell = (
    <IconButton
      label={unread ? t('notificationsUnread', { count: unread }) : t('notifications')}
      icon={<Bell />}
      badge={unread > 0}
      onClick={() => {
        setNotifOpen(true);
        setUnread(0);
      }}
    />
  );
  const tierLabel = tier === 'private' ? t('privateTier') : t('personal');

  return (
    <>
      <SkipLink>{t('skip')}</SkipLink>

      {/* Desktop: fixed sidebar on the page colour, grouped; the current page is a raised tile. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line/20 bg-surface lg:flex">
        <a href={href('home')} className="flex items-center gap-2.5 px-6 pt-6 pb-7">
          <Logo size={34} />
          <span className="grid leading-tight">
            <span className="display text-[1.0625rem] font-bold">{t('brand')}</span>
            <span className="text-xs font-medium text-muted">{tierLabel}</span>
          </span>
        </a>
        <nav aria-label={t('mainNav')} className="flex-1 px-3">
          {(['banking', 'you'] as const).map((group) => (
            <div key={group} className="mb-6">
              <p
                aria-hidden="true"
                className="px-3 pb-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted uppercase"
              >
                {t(group === 'banking' ? 'navGroupBanking' : 'navGroupYou')}
              </p>
              <ul className="grid gap-0.5">
                {NAV.filter((n) => n.group === group).map(({ page, icon: Icon, label }) => (
                  <li key={page}>
                    <a
                      href={href(page)}
                      aria-current={route.page === page ? 'page' : undefined}
                      className="nav-item flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium text-muted transition-colors hover:text-ink"
                    >
                      <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
                      {t(label)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="m-3 flex items-center gap-3 rounded-2xl border border-line/20 bg-bg p-3">
          <Avatar name={market.customerFull} size={38} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{market.customerFull}</p>
            <p className="truncate text-muted">{market.name}</p>
          </div>
          <IconButton label={t('signOut')} icon={<LogOut />} size="sm" onClick={prefs.signOut} />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line/15 bg-surface/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-10">
            <a href={href('home')} className="flex items-center gap-2 font-semibold tracking-tight lg:hidden">
              <Logo size={30} />
              <span className="display">{t('brand')}</span>
            </a>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="search-trigger ml-auto lg:ml-0"
              aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
            >
              <Search aria-hidden="true" size={17} />
              <span className="search-trigger__label">{t('searchOpen')}</span>
              <kbd aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>
            <p className="hidden items-center gap-1.5 text-sm text-muted lg:ml-auto lg:flex">
              <ShieldCheck aria-hidden="true" size={16} className="text-success" />
              {t('lastLogin', {
                time: signedInAt.toLocaleTimeString(kit.locale, {
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              })}
            </p>
            <div className="flex items-center gap-1 lg:ml-4">
              {balanceToggle}
              {bell}
              {/* Decorative: Settings is in the main navigation (a link named "Settings" showing "TW" would fail WCAG 2.5.3). */}
              <span className="ml-1 hidden sm:block">
                <Avatar name={market.customerFull} size={36} />
              </span>
            </div>
          </div>
        </header>

        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto max-w-6xl px-4 pt-6 pb-32 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
        >
          <Suspense fallback={<div aria-busy="true" className="min-h-96" />}>
            {route.page === 'home' && <Home />}
            {route.page === 'activity' && <Activity />}
            {route.page === 'pay' && <Pay params={route.params} />}
            {route.page === 'cards' && <Cards />}
            {route.page === 'settings' && <Settings prefs={prefs} />}
          </Suspense>
          <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-line/20 pt-6 text-sm text-muted">
            <p>{t('fictional')}</p>
            <p className="flex gap-4">
              <a className="font-medium text-link underline-offset-4 hover:underline" href="storybook/">
                {t('storybook')}
              </a>
              <a
                className="font-medium text-link underline-offset-4 hover:underline"
                href="https://github.com/nisakhantalib/my-ui-kit"
              >
                {t('source')}
              </a>
            </p>
          </footer>
        </main>
      </div>

      {/* Phones and tablets: a native-style tab bar, clear of the home indicator. */}
      <nav
        aria-label={t('mainNav')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/20 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ page, icon: Icon, label }, i) => (
            <Fragment key={page}>
              {i === 2 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setMoveOpen(true)}
                    aria-haspopup="dialog"
                    className="flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-muted"
                  >
                    <span className="-mt-5 grid size-12 place-items-center rounded-full bg-brand text-on-brand shadow-lg shadow-brand/30">
                      <Plus aria-hidden="true" size={24} />
                    </span>
                    <span>{t('moveMoney')}</span>
                  </button>
                </li>
              )}
              <li>
                <a
                  href={href(page)}
                  aria-current={route.page === page ? 'page' : undefined}
                  className="group flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-muted aria-[current=page]:text-ink"
                >
                  <span className="grid h-7 w-14 place-items-center rounded-full group-aria-[current=page]:bg-brand/10">
                    <Icon aria-hidden="true" size={21} />
                  </span>
                  <span>{t(label)}</span>
                </a>
              </li>
            </Fragment>
          ))}
        </ul>
      </nav>

      <MoveMoneySheet open={moveOpen} onClose={() => setMoveOpen(false)} />

      {searchOpen && <CommandPalette prefs={prefs} onClose={() => setSearchOpen(false)} />}

      <Dialog open={notifOpen} onClose={() => setNotifOpen(false)} title={t('notifications')}>
        <ul className="mb-4 grid gap-3">
          {notifications.map((n) => (
            <li key={n} className="rounded-xl bg-surface p-3 text-[0.9375rem]">
              {n}
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setNotifOpen(false)}>
            {t('close')}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** The phone's money actions, one tap from any tab: each tile says what it does and for what. */
function MoveMoneySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, market, bills, payees } = useBank();
  const utility = bills.find((b) => b.payeeId !== 'card');
  const utilityName = utility ? (payees.find((p) => p.id === utility.payeeId)?.name ?? '') : '';
  const tiles: { icon: LucideIcon; label: string; hint: string; to: string }[] = [
    { icon: Send, label: t('paySomeone'), hint: t('paySomeoneHint', { rail: market.rail }), to: href('pay') },
    { icon: ArrowLeftRight, label: t('betweenAccounts'), hint: t('betweenHint'), to: href('pay') },
    { icon: QrCode, label: t('qa.rail', { rail: market.rail }), hint: t('scanHint'), to: href('pay') },
    {
      icon: Lightbulb,
      label: t('qa.bills'),
      hint: utility ? `${utilityName} · ${t('dueIn', { days: utility.dueInDays })}` : t('noBills'),
      to: utility ? href('pay', { to: utility.payeeId, amount: utility.amount }) : href('pay'),
    },
    { icon: CreditCard, label: t('qa.cards'), hint: t('cardControlsHint'), to: href('cards') },
    { icon: FileText, label: t('qa.statements'), hint: t('statementsHint'), to: href('activity') },
  ];
  return (
    <Dialog open={open} onClose={onClose} title={t('moveMoney')} placement="bottom" showClose>
      <ul className="grid grid-cols-2 gap-2.5">
        {tiles.map(({ icon: Icon, label, hint, to }) => (
          <li key={label}>
            <a href={to} onClick={onClose} className="action-tile h-full">
              <Icon aria-hidden="true" size={22} />
              {label}
              <small>{hint}</small>
            </a>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
