import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnalyticsProvider,
  AnnouncerProvider,
  Button,
  KitProvider,
  Select,
  SkipLink,
  Switch,
  ToastProvider,
  adobeDataLayerAdapter,
  consoleAdapter,
  useAnnounce,
  usePageView,
} from '@nisakhantalib/my-ui-kit';
import { MARKETS, type Market } from './data';
import { BankProvider, useBank } from './bank';
import { Overview } from './Overview';
import { Pay } from './Pay';
import { Logo } from './Logo';

type Route = 'overview' | 'pay';

function usePersisted<T extends string | boolean>(key: string, initial: () => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved) as T;
    } catch {
      /* storage blocked */
    }
    return initial();
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

function useHashRoute(): Route {
  const read = (): Route => (location.hash.startsWith('#/pay') ? 'pay' : 'overview');
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function App() {
  const [marketCode, setMarketCode] = usePersisted<Market['code']>('market', () => 'SG');
  const [theme, setTheme] = usePersisted<'light' | 'dark'>('theme', () =>
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  const [hideBalances, setHideBalances] = usePersisted<boolean>('hide-balances', () => false);
  const market = MARKETS.find((m) => m.code === marketCode) ?? MARKETS[0]!;
  const adapters = useMemo(() => [consoleAdapter, adobeDataLayerAdapter()], []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.brand = 'orchid';
    root.lang = market.locale;
  }, [theme, market.locale]);

  return (
    <KitProvider locale={market.locale} currency={market.currency}>
      <AnalyticsProvider adapters={adapters}>
        <AnnouncerProvider>
          <ToastProvider>
            <BankProvider key={market.code} market={market} hideBalances={hideBalances}>
              <Shell
                market={market}
                onMarketChange={setMarketCode}
                theme={theme}
                onThemeChange={setTheme}
                hideBalances={hideBalances}
                onHideBalancesChange={setHideBalances}
              />
            </BankProvider>
          </ToastProvider>
        </AnnouncerProvider>
      </AnalyticsProvider>
    </KitProvider>
  );
}

interface ShellProps {
  market: Market;
  onMarketChange: (code: Market['code']) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  hideBalances: boolean;
  onHideBalancesChange: (hide: boolean) => void;
}

function Shell({ market, onMarketChange, theme, onThemeChange, hideBalances, onHideBalancesChange }: ShellProps) {
  const { t } = useBank();
  const route = useHashRoute();
  const mainRef = useRef<HTMLElement>(null);
  const announce = useAnnounce();
  const pageView = usePageView();
  const firstRender = useRef(true);

  // Single-page app navigation: update the title, move focus to the new page's heading and
  // announce it, so screen-reader users know the page changed (there's no page load to tell them).
  useEffect(() => {
    const title = route === 'pay' ? t('payTitle') : t('navOverview');
    document.title = `${title} · ${t('brand')}`;
    pageView(`bank:${route}`, { market: market.code });
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus();
    announce(title);
  }, [route, t, market.code, pageView, announce]);

  const nav: [Route, string, string][] = [
    ['overview', '#/', t('navOverview')],
    ['pay', '#/pay', t('navPay')],
  ];

  return (
    <>
      <SkipLink>{t('skip')}</SkipLink>
      {/* Sticky only from sm up: on phones the wrapped header is tall enough to hide focused content (WCAG 2.4.11). */}
      <header className="z-40 border-b border-line/30 bg-bg/90 backdrop-blur sm:sticky sm:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <a href="#/" className="flex items-center gap-2 rounded-lg text-lg font-bold tracking-tight">
            <Logo />
            {t('brand')}
          </a>
          <nav aria-label={t('brand')} className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
            {nav.map(([key, href, label]) => (
              <a
                key={key}
                href={href}
                aria-current={route === key ? 'page' : undefined}
                className="rounded-full px-4 py-2 text-[0.9375rem] font-semibold text-muted hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-brand"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
            <Select
              label={t('market')}
              className="market-select"
              value={market.code}
              onChange={(e) => onMarketChange(e.target.value as Market['code'])}
            >
              {MARKETS.map((m) => (
                <option key={m.code} value={m.code} lang={m.locale}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Switch label={t('hideBalances')} checked={hideBalances} onCheckedChange={onHideBalancesChange} />
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={theme === 'dark'}
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            >
              {t('darkMode')}
            </Button>
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-8 pb-16 outline-none">
        {route === 'pay' ? <Pay /> : <Overview />}
      </main>

      <footer className="border-t border-line/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted">
          <p className="max-w-xl">{t('fictional')}</p>
          <nav aria-label={t('otherApps')} className="flex gap-4">
            <a className="font-semibold text-brand underline-offset-4 hover:underline" href="clinic/">
              {t('clinicApp')}
            </a>
            <a className="font-semibold text-brand underline-offset-4 hover:underline" href="storybook/">
              {t('storybook')}
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
