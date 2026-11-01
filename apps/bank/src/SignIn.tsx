import { useEffect, useMemo } from 'react';
import { Button, Guilloche, Money, Select, useKit } from '@nisakhantalib/my-ui-kit';
import { Accessibility, ArrowRight, ShieldCheck, SlidersHorizontal, Zap, type LucideIcon } from 'lucide-react';
import type { Preferences } from './App';
import { MARKETS, seed, type Market } from './data';
import { Logo } from './Logo';
import type { StringKey } from './strings';

const FEATURES: [LucideIcon, StringKey][] = [
  [Zap, 'featureInstant'],
  [SlidersHorizontal, 'featureControl'],
  [Accessibility, 'featureAccess'],
];

/**
 * The landing screen. There is no real authentication in a demo, so it says so and offers one
 * button; choosing the market first shows off the five-market setup before anything loads.
 */
export function SignIn({ prefs, onEnter }: { prefs: Preferences; onEnter: () => void }) {
  const { t, market } = prefs;
  const kit = useKit();
  const { accounts, history } = useMemo(() => seed(market, kit.currencyDigits(market.currency)), [market, kit]);
  const total = accounts.filter((a) => a.id !== 'card').reduce((s, a) => s + a.balance, 0);

  useEffect(() => {
    document.title = t('welcomeBack');
  }, [t]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section
        aria-labelledby="pitch"
        className="signin-hero relative flex flex-col overflow-hidden px-5 pt-8 pb-10 sm:px-10 lg:p-12 xl:p-16"
      >
        <Guilloche
          color="var(--kit-brand-accent)"
          accentColor="#c8a25a"
          animate
          className="pointer-events-none absolute -right-48 -bottom-48 size-[44rem] opacity-70 lg:-right-32 lg:-bottom-32"
        />
        <p className="display relative flex items-center gap-2.5 text-lg font-bold">
          <Logo size={36} onBrand />
          {t('brand')}
        </p>
        <div className="relative mt-8 max-w-lg lg:my-auto lg:py-12">
          <h2
            id="pitch"
            className="text-[2rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[2.5rem] lg:text-[2.75rem] xl:text-[3.25rem]"
          >
            {t('signInTitle')}
          </h2>
          <p className="mt-3 opacity-85 lg:mt-5 lg:text-lg">{t('signInIntro')}</p>
          <ul className="mt-10 hidden gap-4 lg:grid">
            {FEATURES.map(([Icon, key]) => (
              <li key={key} className="flex items-center gap-3.5">
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-white/12">
                  <Icon size={19} />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        {/* A glimpse of the app: decorative, so hidden from assistive technology. */}
        <div aria-hidden="true" className="signin-preview relative hidden lg:block">
          <p className="text-sm opacity-75">{t('totalBalance')}</p>
          <p className="display mt-1 text-3xl font-semibold">
            <Money value={total} currency={market.currency} />
          </p>
          <PreviewLine points={history.slice(-60)} />
        </div>
        <p className="relative mt-10 hidden text-sm opacity-70 lg:block">{t('fictional')}</p>
      </section>

      <main id="main" className="flex justify-center px-5 py-10 sm:px-10 lg:items-center lg:py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">{t('welcomeBack')}</h1>
          <p className="mt-2 text-muted">{t('signInHint')}</p>

          <div className="mt-8 grid gap-5">
            <Select
              label={t('chooseMarket')}
              value={market.code}
              onChange={(e) => prefs.setMarket(e.target.value as Market['code'])}
            >
              {MARKETS.map((m) => (
                <option key={m.code} value={m.code} lang={m.locale}>
                  {m.name} · {m.currency}
                </option>
              ))}
            </Select>
            <Button size="lg" onClick={onEnter} trackId="signin-demo">
              {t('viewDemo')}
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <ShieldCheck aria-hidden="true" size={16} className="shrink-0 text-success" />
            {t('secured')}
          </p>
          <p className="mt-12 flex gap-5 border-t border-line/25 pt-6 text-sm">
            <a className="font-medium text-link underline-offset-4 hover:underline" href="/storybook/">
              {t('storybook')}
            </a>
            <a
              className="font-medium text-link underline-offset-4 hover:underline"
              href="https://github.com/nisakhantalib/my-ui-kit"
            >
              {t('source')}
            </a>
          </p>
          <p className="mt-4 text-xs text-muted lg:hidden">{t('fictional')}</p>
        </div>
      </main>
    </div>
  );
}

function PreviewLine({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${36 - ((p - min) / span) * 32}`).join(' ');
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-4 h-20 w-full">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
