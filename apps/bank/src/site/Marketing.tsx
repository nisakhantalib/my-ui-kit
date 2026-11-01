import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  Accordion,
  AccordionItem,
  AmountInput,
  Badge,
  Dialog,
  Guilloche,
  IconButton,
  Money,
  Radio,
  RadioGroup,
  Select,
  SkipLink,
  Switch,
  useKit,
} from '@nisakhantalib/my-ui-kit';
import {
  ArrowRight,
  BellRing,
  Check,
  KeyRound,
  Menu,
  Send,
  Smartphone,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';
import { usePrefs } from '../App';
import { localAmount, MARKETS, type Market } from '../data';
import { Logo } from '../Logo';
import { Monogram } from '../ui';
import { siteCopy } from './copy';

// Recharts is only needed once the calculator scrolls into view.
const SavingsChart = lazy(() => import('./SavingsChart').then((m) => ({ default: m.SavingsChart })));

/** Published (illustrative) rates. */
const RATES = { everyday: 0.0005, savings: 0.0285, fd6: 0.031, fd12: 0.0325, typical: 0.0005 };

/** Overseas rates per 1 SGD (illustrative), converted through SGD for every market. */
const FX: Record<string, number> = { USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 112, AUD: 1.13, MYR: 3.45 };

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const },
};

function useSite() {
  const prefs = usePrefs();
  const kit = useKit();
  const s = siteCopy(prefs.market.lang);
  const digits = kit.currencyDigits(prefs.market.currency);
  const local = (sgd: number) => localAmount(prefs.market, sgd, digits);
  const pct = (v: number) =>
    new Intl.NumberFormat(kit.locale, { style: 'percent', minimumFractionDigits: 2 }).format(v);
  return { ...prefs, kit, s, local, pct, digits };
}

export function Marketing() {
  const { s, t } = useSite();
  useEffect(() => {
    document.title = `${t('brand')} · ${s('heroTitle')}`;
  }, [s, t]);
  return (
    <>
      <SkipLink>{s('skip')}</SkipLink>
      <SiteNav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Markets />
        <div className="mx-auto grid max-w-6xl gap-24 px-5 py-24 sm:px-8 lg:gap-32 lg:py-32">
          <PayRow />
          <SaveRow />
          <ControlRow />
          <OverseasRow />
        </div>
        <Rates />
        <Security />
        <AppBand />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </>
  );
}

function SiteNav() {
  const { s, t } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links: [string, string][] = [
    ['#rates', s('navPersonal')],
    ['#save', s('navSave')],
    ['#control', s('navCards')],
    ['#overseas', s('navOverseas')],
    ['#faq', s('navHelp')],
  ];
  return (
    <header
      data-scrolled={scrolled || undefined}
      className="site-nav fixed inset-x-0 top-0 z-40 transition-colors duration-300"
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-8 px-5 sm:px-8">
        <a href="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="display text-lg font-bold whitespace-nowrap">{t('brand')}</span>
        </a>
        <nav aria-label={s('navMain')} className="hidden lg:block">
          <ul className="flex gap-7 text-[0.9375rem] font-medium">
            {links.map(([to, label]) => (
              <li key={to}>
                <a href={to} className="site-nav__link">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href="/login" className="site-btn site-btn--ghost hidden sm:inline-flex">
            {s('logIn')}
          </a>
          <a href="/login" className="site-btn site-btn--solid hidden sm:inline-flex">
            {s('openAccount')}
          </a>
          <span className="lg:hidden">
            <IconButton label={s('menu')} icon={<Menu />} onClick={() => setOpen(true)} />
          </span>
        </div>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('brand')} placement="bottom" showClose>
        <nav aria-label={s('navMain')}>
          <ul className="grid gap-1 text-lg font-semibold">
            {links.map(([to, label]) => (
              <li key={to}>
                <a
                  href={to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-xl px-3 hover:bg-surface"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2">
            <a href="/login" className="site-btn site-btn--solid justify-center">
              {s('openAccount')}
            </a>
            <a href="/login" className="site-btn site-btn--outline justify-center">
              {s('logIn')}
            </a>
          </div>
        </nav>
      </Dialog>
    </header>
  );
}

function Hero() {
  const { s, t, pct, market, local } = useSite();
  // Pointer parallax: the cards tilt gently towards the pointer (springs, so it never snaps).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 18 });
  return (
    <section
      aria-labelledby="hero-title"
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - box.left) / box.width - 0.5);
        py.set((e.clientY - box.top) / box.height - 0.5);
      }}
      className="site-hero relative overflow-hidden text-white"
    >
      <Guilloche
        color="var(--kit-brand-accent)"
        accentColor="#c8a25a"
        animate
        className="pointer-events-none absolute top-[-14rem] right-[-22rem] size-[62rem] opacity-55 lg:right-[-14rem]"
      />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pt-32 pb-20 sm:px-8 lg:min-h-[52rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:pt-36 lg:pb-28">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent/15 px-3 py-1.5 text-sm font-semibold text-brand-accent"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-accent" />
            {s('badge', { rate: pct(RATES.savings) })}
          </motion.p>
          <h1
            id="hero-title"
            className="mt-6 text-[3rem] leading-[0.98] font-bold tracking-[-0.035em] sm:text-[4rem] lg:text-[5.25rem]"
          >
            {s('heroTitle')}
          </h1>
          <p className="mt-6 max-w-xl text-lg opacity-85 sm:text-xl">{s('heroIntro')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="/login" className="site-btn site-btn--light site-btn--lg">
              {s('openAccount')}
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <a href="/?demo" className="site-btn site-btn--glass site-btn--lg">
              {s('exploreDemo')}
            </a>
          </div>
          <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
            {(
              [
                ['5', s('statMarkets')],
                [s('statFeesValue'), s('statFees')],
                ['24/7', s('statFreeze')],
              ] as const
            ).map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-sm opacity-80">{label}</dt>
                <dd className="display text-3xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <motion.div
          aria-hidden="true"
          style={{ rotateX, rotateY, transformPerspective: 1200 }}
          className="relative mx-auto h-[24rem] w-full max-w-[30rem] sm:h-[28rem]"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -14 }}
            animate={{ opacity: 1, y: [0, -10, 0], rotate: -8 }}
            transition={{
              opacity: { duration: 0.7 },
              rotate: { duration: 0.9 },
              y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="hero-float absolute top-0 right-0 w-[min(100%,22rem)]"
          >
            <div className="relative aspect-[1.586]">
              <div className="acct-card acct-card--card" data-pos="0">
                <Guilloche
                  variant="waves"
                  color="var(--kit-brand-accent)"
                  accentColor="#c8a25a"
                  className="inset-0 size-full"
                />
                <p className="flex text-[0.6875rem] font-semibold tracking-[0.12em] uppercase opacity-80">
                  Orchid<span className="ml-auto">{t('credit')}</span>
                </p>
                <span className="credit-card__chip mt-4" />
                <p className="serial mt-auto flex justify-between text-sm">
                  <span>4539 •••• •••• 5566</span>
                  <span>08/29</span>
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 10 }}
            animate={{ opacity: 1, y: [0, 12, 0], rotate: 5 }}
            transition={{
              opacity: { duration: 0.7, delay: 0.15 },
              rotate: { duration: 0.9, delay: 0.15 },
              y: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="hero-float absolute bottom-0 left-0 w-[min(100%,22rem)]"
          >
            <div className="relative aspect-[1.586]">
              <div className="acct-card acct-card--everyday border border-white/10" data-pos="0">
                <Guilloche
                  color="var(--kit-brand-accent)"
                  accentColor="#c8a25a"
                  className="-top-28 -right-28 size-80"
                />
                <p className="flex text-[0.6875rem] font-semibold tracking-[0.12em] uppercase opacity-80">
                  {t('everyday')}
                  <span className="ml-auto">{t('debit')}</span>
                </p>
                <p className="display mt-auto text-[2rem] leading-none font-semibold">
                  <Money value={local(12480.55)} currency={market.currency} />
                </p>
                <p className="serial mt-2 flex justify-between text-xs opacity-85">
                  <span>012-345678-9</span>
                  <span>{t('available')}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/** The five markets: pick one and the whole site (and app) switches language and currency. */
function Markets() {
  const { s, market, setMarket } = useSite();
  return (
    <section aria-labelledby="markets-title" className="border-b border-line/15 bg-bg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-4 px-5 py-7 sm:px-8">
        <h2 id="markets-title" className="font-sans text-sm font-semibold text-muted">
          {s('marketsTitle')}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {MARKETS.map((m) => (
            <li key={m.code}>
              <button
                type="button"
                aria-pressed={m.code === market.code}
                onClick={() => setMarket(m.code)}
                lang={m.locale}
                className="chip aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg"
              >
                <span className="serial text-xs">{m.currency}</span>
                {m.name.split(' · ')[0]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Row({
  id,
  eyebrow,
  title,
  body,
  children,
  flip,
  extra,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
  flip?: boolean;
  extra?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <motion.div {...reveal} className={flip ? 'lg:order-2' : undefined}>
        <p className="serial text-xs font-medium text-accent uppercase">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-3 text-[2.25rem] leading-[1.05] font-bold sm:text-[2.75rem]">
          {title}
        </h2>
        <p className="mt-5 max-w-lg text-lg text-muted">{body}</p>
        {extra}
      </motion.div>
      <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
        {children}
      </motion.div>
    </section>
  );
}

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="site-phone mx-auto">
      <div className="site-phone__screen">{children}</div>
    </div>
  );
}

function PayRow() {
  const { s, t, market, local } = useSite();
  const people = ['Lim Jia Hui', 'Rahman Ismail', 'Priya Nair', 'Tan Wei Ling'];
  return (
    <Row
      id="pay"
      eyebrow={s('payEyebrow')}
      title={s('payTitle')}
      body={s('payBody', { rail: market.rail })}
      extra={
        <ul className="mt-7 grid gap-3">
          {[s('payPoint1'), s('payPoint2'), s('payPoint3')].map((p) => (
            <li key={p} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-6 place-items-center rounded-full bg-success/12 text-success"
              >
                <Check size={14} strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      }
    >
      <div aria-hidden="true" className="site-stage">
        <Phone>
          <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted uppercase">{s('payEyebrow')}</p>
          <div className="mt-3 flex justify-between">
            {people.map((p, i) => (
              <span
                key={p}
                className={`grid justify-items-center gap-1 text-[0.625rem] ${i === 0 ? 'font-semibold' : 'text-muted'}`}
              >
                <span className={i === 0 ? 'rounded-full ring-2 ring-brand ring-offset-2 ring-offset-bg' : ''}>
                  <Monogram name={p} size={38} />
                </span>
                {p.split(' ')[0]}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-surface p-4 text-center">
            <p className="text-xs text-muted">Lim Jia Hui · {market.rail}</p>
            <p className="display mt-1 text-[2.25rem] leading-none font-bold">
              <Money value={local(250)} currency={market.currency} />
            </p>
          </div>
          <div className="mt-3 grid gap-1.5 rounded-2xl border border-line/20 p-3 text-xs">
            <p className="flex justify-between">
              <span className="text-muted">{t('fee')}</span>
              <span className="font-semibold text-success">{t('noFee')}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted">{t('arrives')}</span>
              <span className="font-semibold">{t('instantly', { rail: market.rail })}</span>
            </p>
          </div>
          <span className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-on-brand">
            <Send size={15} />
            {s('payEyebrow')}
          </span>
        </Phone>
      </div>
    </Row>
  );
}

function SaveRow() {
  const { s, pct, market, local, kit } = useSite();
  const [amountSgd, setAmountSgd] = useState(20000);
  const [years, setYears] = useState(3);
  const principal = local(amountSgd);
  const grow = (rate: number, months: number) => Math.round(principal * ((1 + rate / 12) ** months - 1));
  const earned = grow(RATES.savings, years * 12);
  const typical = grow(RATES.typical, years * 12);
  const money = (v: number) => kit.formatMoney(v, { currency: market.currency });
  return (
    <Row
      id="save"
      eyebrow={s('saveEyebrow')}
      title={s('saveTitle', { rate: pct(RATES.savings) })}
      body={s('saveBody')}
      flip
    >
      <div className="hero-card brand-panel p-6 sm:p-8">
        <Guilloche
          color="var(--kit-brand-accent)"
          accentColor="#c8a25a"
          className="-top-40 -right-40 size-[28rem] opacity-45"
        />
        <label htmlFor="calc-amount" className="font-semibold opacity-85">
          {s('calcAmount')}
        </label>
        <p className="display mt-1 text-[2.5rem] leading-none font-bold" aria-hidden="true">
          <Money value={principal} currency={market.currency} emphasiseMajor={false} />
        </p>
        <input
          id="calc-amount"
          type="range"
          min={1000}
          max={50000}
          step={500}
          value={amountSgd}
          aria-valuetext={money(principal)}
          onChange={(e) => setAmountSgd(Number(e.target.value))}
          className="site-range mt-5 w-full"
        />
        <div className="mt-5">
          <RadioGroup
            legend={s('calcYears')}
            legendHidden
            name="calc-years"
            variant="segmented"
            value={String(years)}
            onValueChange={(v) => setYears(Number(v))}
          >
            {[1, 3, 5].map((n) => (
              <Radio key={n} value={String(n)} label={n === 1 ? s('calcYear1') : s('calcYearsN', { n })} />
            ))}
          </RadioGroup>
        </div>
        <div className="mt-6 border-t border-white/15 pt-5" aria-live="polite">
          <p className="font-semibold opacity-85">{s('calcEarn')}</p>
          <p className="display text-[3rem] leading-none font-bold text-brand-accent">
            <Money value={earned} currency={market.currency} signDisplay="always" />
          </p>
          <p className="mt-2 text-sm opacity-80">{s('calcVs', { rate: pct(RATES.typical), amount: money(typical) })}</p>
        </div>
        <Suspense fallback={<div className="mt-4 h-36" />}>
          <SavingsChart
            principal={principal}
            years={years}
            rate={RATES.savings}
            typicalRate={RATES.typical}
            label={s('calcChart', { n: years })}
            orchidLabel={s('calcOrchid', { rate: pct(RATES.savings) })}
            typicalLabel={s('calcTypical', { rate: pct(RATES.typical) })}
            format={money}
          />
        </Suspense>
        <p className="mt-3 text-xs opacity-70">{s('calcNote')}</p>
      </div>
    </Row>
  );
}

function ControlRow() {
  const { s, market } = useSite();
  const [frozen, setFrozen] = useState(false);
  return (
    <Row id="control" eyebrow={s('controlEyebrow')} title={s('controlTitle')} body={s('controlBody')}>
      <div className="site-stage grid justify-items-center gap-6">
        <motion.div
          animate={{ rotate: frozen ? 0 : -4, scale: frozen ? 0.97 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={`credit-card relative aspect-[1.586] w-full max-w-[24rem] overflow-hidden rounded-[1.25rem] p-6 ${frozen ? 'credit-card--off' : ''}`}
        >
          <Guilloche
            variant="waves"
            color="var(--kit-brand-accent)"
            accentColor="#c8a25a"
            className="inset-0 size-full"
          />
          <div className="relative flex h-full flex-col">
            <p className="display flex items-center gap-2 text-lg font-bold uppercase">
              <Logo size={26} />
              Orchid
            </p>
            <span aria-hidden="true" className="credit-card__chip mt-4" />
            <p className="serial mt-auto text-lg">•••• 5566</p>
            <p className="flex justify-between text-sm opacity-85">
              <span>{market.customerFull}</span>
              <span className="serial">08/29</span>
            </p>
          </div>
          {frozen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[2px]"
            >
              <Badge tone="info">
                <Snowflake aria-hidden="true" size={14} />
                {s('frozen')}
              </Badge>
            </motion.div>
          )}
        </motion.div>
        <div className="w-full max-w-[24rem] rounded-2xl bg-bg p-4 shadow-sm">
          <Switch label={s('controlTry')} checked={frozen} onCheckedChange={setFrozen} />
        </div>
      </div>
    </Row>
  );
}

function OverseasRow() {
  const { s, market, kit } = useSite();
  const targets = Object.keys(FX).filter((c) => c !== market.currency);
  const [to, setTo] = useState(targets[0]!);
  const digits = kit.currencyDigits(market.currency);
  const [amount, setAmount] = useState<number | null>(1000 * market.rate * 10 ** digits);
  const perLocal = FX[to]! / market.rate; // target units per 1 unit of local currency
  const toDigits = kit.currencyDigits(to);
  const received = amount ? Math.round((amount / 10 ** digits) * perLocal * 10 ** toDigits) : 0;
  const fee = kit.formatMoney(localAmount(market, 2.5, digits), { currency: market.currency });
  return (
    <Row id="overseas" eyebrow={s('goEyebrow')} title={s('goTitle')} body={s('goBody')} flip>
      <div className="card grid gap-5 p-6 sm:p-8">
        <AmountInput label={s('goSend')} value={amount} onValueChange={setAmount} currency={market.currency} />
        <Select label={s('goReceive')} value={to} onChange={(e) => setTo(e.target.value)}>
          {targets.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <div className="rounded-2xl bg-surface p-5" aria-live="polite">
          <p className="text-sm text-muted">{s('goReceive')}</p>
          <p className="display mt-1 text-[2.25rem] leading-none font-bold">
            <Money value={received} currency={to} />
          </p>
          <p className="mt-3 text-sm text-muted">
            {s('goRate', {
              from: market.currency,
              rate: new Intl.NumberFormat(kit.locale, { maximumSignificantDigits: 4 }).format(perLocal),
              to,
            })}
          </p>
          <p className="text-sm text-muted">{s('goFee', { fee })}</p>
        </div>
      </div>
    </Row>
  );
}

function Rates() {
  const { s, pct, local, market, kit } = useSite();
  const min = kit.formatMoney(local(1000), { currency: market.currency });
  const rows: [string, number, string][] = [
    [s('rateEveryday'), RATES.everyday, s('rateEverydayDetail')],
    [s('rateSavings'), RATES.savings, s('rateSavingsDetail')],
    [s('rateFd6'), RATES.fd6, s('rateFd6Detail', { min })],
    [s('rateFd12'), RATES.fd12, s('rateFd12Detail', { min })],
  ];
  return (
    <section id="rates" aria-labelledby="rates-title" className="bg-bg py-24">
      <motion.div {...reveal} className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="rates-title" className="text-[2.25rem] font-bold sm:text-[2.75rem]">
          {s('ratesTitle')}
        </h2>
        <p className="mt-3 max-w-xl text-lg text-muted">{s('ratesIntro')}</p>
        {/* Scrolls sideways on narrow screens, so it can take focus for keyboard scrolling (WCAG 2.1.1). */}
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="rates-title"
          className="mt-10 overflow-x-auto rounded-2xl border border-line/20"
        >
          <table className="site-table w-full min-w-[36rem] text-left">
            <thead>
              <tr>
                <th scope="col">{s('ratesProduct')}</th>
                <th scope="col" className="text-right">
                  {s('ratesRate')}
                </th>
                <th scope="col">{s('ratesDetail')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, rate, detail]) => (
                <tr key={name}>
                  <th scope="row" className="font-semibold">
                    {name}
                  </th>
                  <td className="money text-right text-2xl font-bold">{pct(rate)}</td>
                  <td className="text-muted">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">{s('ratesNote')}</p>
      </motion.div>
    </section>
  );
}

function Security() {
  const { s } = useSite();
  const items: [LucideIcon, string, string][] = [
    [Smartphone, s('secDevice'), s('secDeviceBody')],
    [KeyRound, s('secOtp'), s('secOtpBody')],
    [Snowflake, s('secFreeze'), s('secFreezeBody')],
    [BellRing, s('secAlerts'), s('secAlertsBody')],
  ];
  return (
    <section
      id="security"
      aria-labelledby="security-title"
      className="site-hero relative overflow-hidden py-24 text-white"
    >
      <Guilloche
        color="var(--kit-brand-accent)"
        accentColor="#c8a25a"
        className="pointer-events-none absolute -bottom-80 -left-80 size-[50rem] opacity-35"
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <motion.h2 {...reveal} id="security-title" className="text-[2.25rem] font-bold sm:text-[2.75rem]">
          {s('secTitle')}
        </motion.h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([Icon, title, body], i) => (
            <motion.li
              key={title}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="rounded-2xl border border-white/12 bg-white/6 p-6"
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-xl bg-brand-accent/15 text-brand-accent"
              >
                <Icon size={21} />
              </span>
              <h3 className="display mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-[0.9375rem] opacity-80">{body}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AppBand() {
  const { s } = useSite();
  return (
    <section aria-labelledby="app-title" className="py-24">
      <motion.div
        {...reveal}
        className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div>
          <h2 id="app-title" className="text-[2.25rem] font-bold sm:text-[2.75rem]">
            {s('appTitle')}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">{s('appBody')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/?demo" className="site-btn site-btn--solid site-btn--lg">
            {s('appOpen')}
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a
            href="https://github.com/nisakhantalib/my-ui-kit/tree/main/apps/bank/android"
            className="site-btn site-btn--outline site-btn--lg"
          >
            {s('appAndroid')}
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function Faq() {
  const { s } = useSite();
  const qs = [1, 2, 3, 4, 5] as const;
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-bg py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2 id="faq-title" className="text-[2.25rem] font-bold sm:text-[2.75rem]">
          {s('faqTitle')}
        </h2>
        <Accordion type="single" headingLevel={3} className="mt-10">
          {qs.map((n) => (
            <AccordionItem key={n} value={`q${n}`} title={s(`faq${n}q`)}>
              <p className="text-muted">{s(`faq${n}a`)}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Cta() {
  const { s } = useSite();
  return (
    <section aria-labelledby="cta-title" className="px-5 py-24 sm:px-8">
      <motion.div
        {...reveal}
        className="site-hero relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-12"
      >
        <Guilloche
          color="var(--kit-brand-accent)"
          accentColor="#c8a25a"
          className="pointer-events-none absolute -top-60 left-1/2 size-[40rem] -translate-x-1/2 opacity-40"
        />
        <h2 id="cta-title" className="relative text-[2.25rem] font-bold sm:text-[3rem]">
          {s('ctaTitle')}
        </h2>
        <p className="relative mt-3 text-lg opacity-85">{s('ctaBody')}</p>
        <a href="/login" className="site-btn site-btn--light site-btn--lg relative mt-8">
          {s('openAccount')}
          <ArrowRight aria-hidden="true" size={18} />
        </a>
      </motion.div>
    </section>
  );
}

function SiteFooter() {
  const { s, t, market, setMarket } = useSite();
  const cols: [string, [string, string][]][] = [
    [
      s('footPersonal'),
      [
        [s('rateEveryday'), '#rates'],
        [s('rateSavings'), '#save'],
        [s('navOverseas'), '#overseas'],
      ],
    ],
    [
      s('footCards'),
      [
        [s('controlTitle'), '#control'],
        [s('logIn'), '/login'],
      ],
    ],
    [
      s('footHelp'),
      [
        [s('faqTitle'), '#faq'],
        [s('footSecurity'), '#security'],
      ],
    ],
    [
      s('footAbout'),
      [
        [s('footStorybook'), '/storybook/'],
        [s('footSource'), 'https://github.com/nisakhantalib/my-ui-kit'],
        [s('footCase'), 'https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/case-study.md'],
      ],
    ],
  ];
  return (
    <footer className="border-t border-line/20 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
        <div>
          <a href="/" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="display text-lg font-bold">{t('brand')}</span>
          </a>
          <div className="mt-6 max-w-xs">
            <Select
              label={s('footMarket')}
              value={market.code}
              onChange={(e) => setMarket(e.target.value as Market['code'])}
            >
              {MARKETS.map((m) => (
                <option key={m.code} value={m.code} lang={m.locale}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {cols.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="text-sm font-semibold">{title}</p>
            <ul className="mt-4 grid gap-2.5 text-[0.9375rem] text-muted">
              {links.map(([label, to]) => (
                <li key={label}>
                  <a href={to} className="underline-offset-4 hover:text-ink hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line/15">
        <p className="mx-auto max-w-7xl px-5 py-6 text-sm text-muted sm:px-8">
          © 2026 {t('brand')}. {s('footLegal')}
        </p>
      </div>
    </footer>
  );
}
