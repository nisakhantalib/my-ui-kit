import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Showcase } from './Showcase';
import {
  Accordion,
  AccordionItem,
  Alert,
  AnalyticsProvider,
  AnnouncerProvider,
  Button,
  Dialog,
  Radio,
  RadioGroup,
  Select,
  SkipLink,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  ToastProvider,
  adobeDataLayerAdapter,
  adobeWebSdkAdapter,
  consoleAdapter,
  useAnnounce,
  usePageView,
  useToast,
  useTrack,
} from '@nisakhantalib/my-ui-kit';
import { shareBooking } from './native';

// ---------------------------------------------------------------------------
// Data + validation
// ---------------------------------------------------------------------------

const CLINICS = [
  { id: 'tampines', name: 'Tampines Family Clinic', area: 'East' },
  { id: 'jurong', name: 'Jurong West Medical Centre', area: 'West' },
  { id: 'toapayoh', name: 'Toa Payoh Health Hub', area: 'Central' },
] as const;

type Step = 'details' | 'clinic' | 'review';
const SLOTS = [
  ['0900', '9:00 am'],
  ['0930', '9:30 am'],
  ['1400', '2:00 pm'],
  ['1630', '4:30 pm'],
] as const;

type Form = { name: string; nric: string; email: string; date: string; time: string; clinic: string };
type Errors = Partial<Record<keyof Form, string>>;
export type Booking = { id: string; name: string; nricMasked: string; clinic: string; date: string; time?: string };

const EMPTY: Form = { name: '', nric: '', email: '', date: '', time: '', clinic: '' };
const slotLabel = (time: string | undefined) => SLOTS.find(([v]) => v === time)?.[1] ?? '';

/** '2026-10-30' -> 'Fri, 30 Oct 2026'. Parsed as local midnight so the day never shifts by time zone. */
export const formatDate = (iso: string) =>
  iso
    ? new Date(`${iso}T00:00`).toLocaleDateString('en-SG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

/**
 * Singapore NRIC/FIN check (S, T, F, G prefixes).
 * Weights 2,7,6,5,4,3,2; T/G add 4; remainder mod 11 picks the check letter.
 * Example: S1234567D -> 1·2+2·7+3·6+4·5+5·4+6·3+7·2 = 106 -> 106 % 11 = 7 -> "JZIHGFEDCBA"[7] = D
 */
export function isValidNric(value: string): boolean {
  const v = value.trim().toUpperCase();
  const m = /^([STFG])(\d{7})([A-Z])$/.exec(v);
  if (!m) return false;
  const [, prefix, digits, check] = m as unknown as [string, string, string, string];
  const weights = [2, 7, 6, 5, 4, 3, 2];
  let sum = digits.split('').reduce((acc, d, i) => acc + Number(d) * weights[i]!, 0);
  if (prefix === 'T' || prefix === 'G') sum += 4;
  const table = prefix === 'S' || prefix === 'T' ? 'JZIHGFEDCBA' : 'XWUTRQPNMLK';
  return table[sum % 11] === check;
}

/** Store only the last 4 characters (PDPA-friendly): S1234567D -> *****567D */
const maskNric = (nric: string) => '*****' + nric.trim().toUpperCase().slice(-4);

function validate(step: Step, f: Form): Errors {
  const e: Errors = {};
  if (step === 'details' || step === 'review') {
    if (!f.name.trim()) e.name = 'Enter your full name';
    if (!isValidNric(f.nric)) e.nric = 'Enter a valid NRIC or FIN, for example S1234567D';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter an email address like name@example.com';
  }
  if (step === 'clinic' || step === 'review') {
    if (!f.clinic) e.clinic = 'Choose a clinic';
    const today = new Date().toISOString().slice(0, 10);
    if (!f.date) e.date = 'Choose an appointment date';
    else if (f.date < today) e.date = 'The date must be today or later';
    if (!f.time) e.time = 'Choose a time slot';
  }
  return e;
}

const loadBookings = (): Booking[] => {
  try {
    return JSON.parse(localStorage.getItem('bookings') ?? '[]') as Booking[];
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

type Theme = 'light' | 'dark';

/** Theme from storage, else the OS setting. Written to <html data-theme> so the library tokens switch. */
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* storage blocked */
    }
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage blocked */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

/** Tiny hash router: '#/components' or the booking page. No dependency needed for two routes. */
function useHashRoute() {
  const read = () => (location.hash === '#/components' ? 'components' : 'book');
  const [route, setRoute] = useState<'book' | 'components'>(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

// ---------------------------------------------------------------------------
// Booking flow
// ---------------------------------------------------------------------------

function BookingFlow() {
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [bookings, setBookings] = useState<Booking[]>(loadBookings);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const announce = useAnnounce();
  const toast = useToast();
  const track = useTrack();
  const pageView = usePageView();
  const online = useOnline();

  useEffect(() => pageView(`booking:${step}`), [step, pageView]);
  useEffect(() => {
    try {
      localStorage.setItem('bookings', JSON.stringify(bookings));
    } catch {
      /* storage blocked: keep in memory */
    }
  }, [bookings]);

  const set = (key: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Validate, show errors, move focus to the first bad field, and announce the count. */
  function check(target: Step): boolean {
    const found = validate(target, form);
    setErrors(found);
    const keys = Object.keys(found) as (keyof Form)[];
    if (keys.length === 0) return true;
    announce(`${keys.length} ${keys.length === 1 ? 'error' : 'errors'} on this step. ${found[keys[0]!]}.`, 'assertive');
    track('form_error', { component: 'BookingForm', step: target, count: keys.length });
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus());
    return false;
  }

  function next(from: Step, to: Step) {
    if (check(from)) setStep(to);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step !== 'review') return;
    if (check('review')) setConfirmOpen(true);
  }

  async function confirm() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // stand-in for an API call
    const clinic = CLINICS.find((c) => c.id === form.clinic)!;
    const booking: Booking = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      nricMasked: maskNric(form.nric),
      clinic: clinic.name,
      date: form.date,
      time: form.time,
    };
    setBookings((b) => [booking, ...b]);
    track('form_submit', { component: 'BookingForm', clinic: clinic.id, offline: !online });
    setSaving(false);
    setConfirmOpen(false);
    setForm(EMPTY);
    setStep('details');
    // The toast announces itself through its own live region, so no separate announce() here.
    toast({
      title: 'Booking confirmed',
      description: `${clinic.name} on ${formatDate(form.date)} at ${slotLabel(form.time)}.`,
      tone: 'success',
      action: {
        label: 'Share',
        onClick: async () => {
          if ((await shareBooking(booking, slotLabel(booking.time))) === 'copied')
            toast({ title: 'Booking details copied' });
        },
      },
    });
  }

  const clinicName = useMemo(() => CLINICS.find((c) => c.id === form.clinic)?.name ?? '—', [form.clinic]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* minmax(0,1fr): let the column shrink to the screen so wide content (the tab bar) scrolls
          inside its box instead of widening the page (WCAG 1.4.10 Reflow at 320px). */}
      <section aria-labelledby="book-heading" className="rounded-2xl border border-line/40 bg-surface p-6">
        <h2 id="book-heading" className="mb-4 text-xl font-bold">
          Book an appointment
        </h2>

        {!online && (
          <Alert tone="warning" title="You are offline" className="mb-4">
            You can still book. It is saved on this device.
          </Alert>
        )}

        <form ref={formRef} onSubmit={onSubmit} noValidate>
          <Tabs value={step} onValueChange={(v) => setStep(v as Step)} activation="manual">
            <TabList label="Booking steps">
              <Tab value="details">1. Your details</Tab>
              <Tab value="clinic">2. Clinic &amp; date</Tab>
              <Tab value="review">3. Review</Tab>
            </TabList>

            <TabPanel value="details">
              <div className="grid gap-4">
                <TextField
                  label="Full name"
                  name="name"
                  autoComplete="name"
                  required
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => set('name')(e.target.value)}
                />
                <TextField
                  label="NRIC / FIN"
                  name="nric"
                  hint="Demo only. Try S1234567D. We store the last 4 characters."
                  required
                  value={form.nric}
                  error={errors.nric}
                  onChange={(e) => set('nric')(e.target.value)}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={form.email}
                  error={errors.email}
                  onChange={(e) => set('email')(e.target.value)}
                />
                <div>
                  <Button onClick={() => next('details', 'clinic')} trackId="step-details-next">
                    Continue
                  </Button>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="clinic">
              <div className="grid gap-4">
                <RadioGroup
                  legend="Clinic"
                  name="clinic"
                  variant="cards"
                  required
                  value={form.clinic}
                  error={errors.clinic}
                  onValueChange={set('clinic')}
                >
                  {CLINICS.map((c) => (
                    <Radio key={c.id} value={c.id} label={c.name} description={`${c.area} region`} />
                  ))}
                </RadioGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Appointment date"
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    error={errors.date}
                    onChange={(e) => set('date')(e.target.value)}
                  />
                  <Select
                    label="Time slot"
                    name="time"
                    placeholder="Choose a time"
                    required
                    value={form.time}
                    error={errors.time}
                    onChange={(e) => set('time')(e.target.value)}
                  >
                    {SLOTS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep('details')}>
                    Back
                  </Button>
                  <Button onClick={() => next('clinic', 'review')} trackId="step-clinic-next">
                    Continue
                  </Button>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="review">
              <dl className="mb-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
                <dt className="font-semibold">Name</dt>
                <dd>{form.name || '—'}</dd>
                <dt className="font-semibold">NRIC / FIN</dt>
                <dd>{form.nric ? maskNric(form.nric) : '—'}</dd>
                <dt className="font-semibold">Email</dt>
                <dd>{form.email || '—'}</dd>
                <dt className="font-semibold">Clinic</dt>
                <dd>{clinicName}</dd>
                <dt className="font-semibold">Date</dt>
                <dd>{formatDate(form.date) || '—'}</dd>
                <dt className="font-semibold">Time</dt>
                <dd>{slotLabel(form.time) || '—'}</dd>
              </dl>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('clinic')}>
                  Back
                </Button>
                <Button type="submit">Confirm booking</Button>
              </div>
            </TabPanel>
          </Tabs>
        </form>
      </section>

      <aside aria-labelledby="mine-heading" className="rounded-2xl border border-line/40 p-6">
        <h2 id="mine-heading" className="mb-3 text-lg font-bold">
          My bookings <span className="text-muted">({bookings.length})</span>
        </h2>
        {bookings.length === 0 ? (
          <p className="text-muted">No bookings yet.</p>
        ) : (
          <ul className="grid gap-3">
            {bookings.map((b) => (
              <li key={b.id} className="rounded-lg bg-surface p-3">
                <p className="font-semibold">{b.clinic}</p>
                <p className="text-sm text-muted">
                  {formatDate(b.date)}
                  {b.time && ` ${slotLabel(b.time)}`} · {b.name} · {b.nricMasked}
                </p>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-8 mb-2 text-lg font-bold">Questions</h2>
        <Accordion type="single" headingLevel={3}>
          <AccordionItem value="bring" title="What should I bring?">
            Your NRIC or FIN card, and any referral letter or medication you are taking.
          </AccordionItem>
          <AccordionItem value="cancel" title="Can I change or cancel?">
            Yes, up to 24 hours before your appointment, from this page.
          </AccordionItem>
          <AccordionItem value="offline" title="Does it work without internet?">
            Yes. Install the app and bookings are saved on your device.
          </AccordionItem>
        </Accordion>
      </aside>

      <Dialog
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title="Confirm this booking?"
        description={`${clinicName} on ${formatDate(form.date)} at ${slotLabel(form.time)}. You can cancel up to 24 hours before.`}
        initialFocusRef={confirmRef}
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button ref={confirmRef} loading={saving} onClick={confirm} trackId="confirm-booking">
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

const ADOBE_VARIABLES = {
  component: 'eVar5',
  id: 'prop3',
  step: 'eVar10',
  clinic: 'eVar11',
  tab: 'prop5',
  item: 'prop6',
};
const ADOBE_EVENTS = { form_submit: 'event12', form_error: 'event13' };

export function App() {
  const [consent, setConsent] = useState(() => localStorage.getItem('analytics-consent') === 'yes');
  const [asked, setAsked] = useState(() => localStorage.getItem('analytics-consent') !== null);
  const bannerRef = useRef<HTMLDivElement>(null);
  // Each adapter is a no-op until its Adobe library is loaded on the page (via Adobe Tags).
  const adapters = useMemo(
    () => [
      consoleAdapter,
      adobeDataLayerAdapter(),
      // Mapping agreed in the tracking plan: docs/specs/booking-flow.md#analytics-tracking-plan
      adobeWebSdkAdapter({ variableMap: ADOBE_VARIABLES, eventMap: ADOBE_EVENTS }),
    ],
    [],
  );
  const online = useOnline();
  const [theme, setTheme] = useTheme();
  const route = useHashRoute();

  // WCAG 2.2 SC 2.4.11 Focus Not Obscured: while the fixed banner is open, reserve its
  // height as scroll padding so the browser never scrolls a focused field underneath it.
  useEffect(() => {
    const root = document.documentElement;
    if (asked || !bannerRef.current) {
      root.style.scrollPaddingBottom = '';
      return;
    }
    const update = () => (root.style.scrollPaddingBottom = `${bannerRef.current!.offsetHeight + 16}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bannerRef.current);
    return () => {
      observer.disconnect();
      root.style.scrollPaddingBottom = '';
    };
  }, [asked]);

  function giveConsent(value: boolean) {
    try {
      localStorage.setItem('analytics-consent', value ? 'yes' : 'no');
    } catch {
      /* storage blocked: remember for this session only */
    }
    setConsent(value);
    setAsked(true);
  }

  return (
    <AnalyticsProvider adapters={adapters} enabled={consent}>
      <AnnouncerProvider>
        <ToastProvider>
          <SkipLink />
          <header className="border-b border-line/40">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
              <p className="text-lg font-bold">
                <span aria-hidden="true">✚ </span>ClinicBook SG
              </p>
              <nav aria-label="Main" className="flex gap-1">
                {(
                  [
                    ['book', '#/', 'Book'],
                    ['components', '#/components', 'Components'],
                  ] as const
                ).map(([key, href, label]) => (
                  <a
                    key={key}
                    href={href}
                    aria-current={route === key ? 'page' : undefined}
                    className="rounded-lg px-3 py-2 font-semibold text-muted hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-brand"
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={theme === 'dark'}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  Dark mode
                </Button>
                <p
                  role="status"
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${online ? 'bg-surface' : 'bg-danger text-white'}`}
                >
                  {online ? 'Online' : 'Offline — bookings saved on this device'}
                </p>
              </div>
            </div>
          </header>

          <main id="main" tabIndex={-1} className={`mx-auto max-w-5xl px-4 py-8 ${asked ? '' : 'pb-48'}`}>
            {route === 'components' ? (
              <>
                <h1 className="mb-2 text-3xl font-bold">Components</h1>
                <p className="mb-8 max-w-prose text-muted">
                  Every <strong>My UI Kit</strong> component in every state, rendered from the published library. Switch
                  dark mode to see the same components re-themed by design tokens.
                </p>
                <Showcase theme={theme} />
              </>
            ) : (
              <>
                <h1 className="mb-2 text-3xl font-bold">Clinic appointments</h1>
                <p className="mb-8 max-w-prose text-muted">
                  A reference app for <strong>My UI Kit</strong>: every control works with keyboard only and with screen
                  readers (NVDA, VoiceOver, TalkBack), and the app installs and runs offline as a PWA.
                </p>
                <BookingFlow />
              </>
            )}
          </main>

          {!asked && (
            <div
              ref={bannerRef}
              role="region"
              aria-label="Cookie consent"
              className="fixed inset-x-0 bottom-0 z-50 border-t border-line/40 bg-bg p-4 shadow-2xl"
            >
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
                <p>We use analytics to improve this service. Allow anonymous usage tracking?</p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => giveConsent(false)}>
                    No thanks
                  </Button>
                  <Button onClick={() => giveConsent(true)}>Allow</Button>
                </div>
              </div>
            </div>
          )}
        </ToastProvider>
      </AnnouncerProvider>
    </AnalyticsProvider>
  );
}
