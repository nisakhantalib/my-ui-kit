import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
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
  House,
  ReceiptText,
  Settings as SettingsIcon,
  ShieldCheck,
} from 'lucide-react';
import { MARKETS, type Market } from './data';
import { BankProvider, useBank } from './bank';
import { href, useRoute, type Page } from './router';
import { Avatar, requestHeadingFocus } from './ui';
import { Logo } from './Logo';
import { Home } from './pages/Home';
import type { StringKey } from './strings';

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
}

export function App() {
  const [marketCode, setMarket] = usePersisted<Market['code']>('market', 'SG');
  const [theme, setTheme] = usePersisted<Theme>('theme', 'system');
  const [tier, setTier] = usePersisted<Tier>('tier', 'personal');
  const [hideBalances, setHideBalances] = usePersisted<boolean>('hide-balances', false);
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

  const prefs: Preferences = { market, setMarket, theme, setTheme, tier, setTier };

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
              <Shell prefs={prefs} />
            </BankProvider>
          </ToastProvider>
        </AnnouncerProvider>
      </AnalyticsProvider>
    </KitProvider>
  );
}

const NAV: { page: Page; icon: typeof House; label: StringKey; short?: StringKey }[] = [
  { page: 'home', icon: House, label: 'nav.home' },
  { page: 'activity', icon: ReceiptText, label: 'nav.activity' },
  { page: 'pay', icon: ArrowLeftRight, label: 'nav.pay', short: 'nav.payShort' },
  { page: 'cards', icon: CreditCard, label: 'nav.cards' },
  { page: 'settings', icon: SettingsIcon, label: 'nav.settings' },
];

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

      {/* Desktop: fixed sidebar. Below 1024px it gives way to the bottom tab bar. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line/25 bg-bg lg:flex">
        <a
          href={href('home')}
          className="flex items-center gap-2.5 px-6 pt-6 pb-8 text-[1.0625rem] font-semibold tracking-tight"
        >
          <Logo size={34} />
          <span className="grid leading-tight">
            {t('brand')}
            <span className="text-xs font-medium text-muted">{tierLabel}</span>
          </span>
        </a>
        <nav aria-label={t('mainNav')} className="flex-1 px-3">
          <ul className="grid gap-1">
            {NAV.map(({ page, icon: Icon, label }) => (
              <li key={page}>
                <a
                  href={href(page)}
                  aria-current={route.page === page ? 'page' : undefined}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium text-muted transition-colors hover:bg-surface hover:text-ink aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
                >
                  <Icon aria-hidden="true" size={20} strokeWidth={2} />
                  {t(label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="m-3 flex items-center gap-3 rounded-2xl bg-surface p-3">
          <Avatar name={market.customerFull} size={38} />
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold">{market.customerFull}</p>
            <p className="truncate text-muted">{market.name}</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line/20 bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-10">
            <a href={href('home')} className="flex items-center gap-2 font-semibold tracking-tight lg:hidden">
              <Logo size={30} />
              {t('brand')}
            </a>
            <p className="hidden items-center gap-1.5 text-sm text-muted lg:flex">
              <ShieldCheck aria-hidden="true" size={16} className="text-success" />
              {t('lastLogin', {
                time: signedInAt.toLocaleTimeString(kit.locale, {
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              })}
            </p>
            <div className="ml-auto flex items-center gap-1">
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
              <a className="font-medium text-brand underline-offset-4 hover:underline" href="storybook/">
                {t('storybook')}
              </a>
              <a
                className="font-medium text-brand underline-offset-4 hover:underline"
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
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/25 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ page, icon: Icon, label, short }) => (
            <li key={page}>
              <a
                href={href(page)}
                aria-current={route.page === page ? 'page' : undefined}
                className="group flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-muted aria-[current=page]:text-brand"
              >
                {page === 'pay' ? (
                  <span className="grid size-11 place-items-center rounded-full bg-brand text-on-brand shadow-lg shadow-brand/30">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                ) : (
                  <span className="grid h-7 w-14 place-items-center rounded-full group-aria-[current=page]:bg-brand/12">
                    <Icon aria-hidden="true" size={21} />
                  </span>
                )}
                <span>{t(short ?? label)}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

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
