import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionItem,
  Alert,
  Button,
  Checkbox,
  Dialog,
  ErrorSummary,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  useAnnounce,
  useToast,
} from '@nisakhantalib/my-ui-kit';

/**
 * Living style guide: every component in every state, rendered from the real library.
 * Also used to produce the screenshots in the pitch deck.
 */

// ---------- Contrast maths (WCAG 2.x relative luminance) ----------

function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Resolve a CSS custom property to rgb() by applying it to a probe element. */
function resolveColor(token: string, probe: HTMLElement): string {
  probe.style.color = `var(${token})`;
  return getComputedStyle(probe).color;
}

const TOKENS = [
  { token: '--kit-text', label: 'Text', min: 4.5 },
  { token: '--kit-text-muted', label: 'Muted text', min: 4.5 },
  { token: '--kit-primary', label: 'Primary', min: 4.5 },
  { token: '--kit-danger', label: 'Danger', min: 4.5 },
  { token: '--kit-success', label: 'Success', min: 4.5 },
  { token: '--kit-warning', label: 'Warning', min: 4.5 },
  { token: '--kit-border', label: 'Input border', min: 3 },
  { token: '--kit-focus', label: 'Focus ring', min: 3 },
];

function TokenTable({ theme }: { theme: string }) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const [rows, setRows] = useState<{ label: string; token: string; color: string; ratio: number; min: number }[]>([]);

  // Recompute when the theme changes: values come from the live CSS, not a hard-coded list.
  // Child effects run before the parent's, and the parent (App) is what writes <html data-theme>,
  // so measure on the next frame, once the new theme is applied.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const probe = probeRef.current;
      if (!probe) return;
      const bg = resolveColor('--kit-bg', probe);
      setRows(TOKENS.map((t) => {
        const color = resolveColor(t.token, probe);
        return { ...t, color, ratio: contrastRatio(color, bg) };
      }));
      probe.style.color = '';
    });
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  return (
    <>
      <span ref={probeRef} hidden />
      <table className="w-full border-collapse text-left">
        <caption className="mb-2 text-left text-sm text-muted">Contrast against the page background, measured from the live CSS</caption>
        <thead>
          <tr className="border-b border-line/50">
            <th scope="col" className="py-2">Token</th>
            <th scope="col" className="py-2">Colour</th>
            <th scope="col" className="py-2 text-right">Contrast</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.token} className="border-b border-line/20">
              <td className="py-2">
                {r.label} <code className="text-sm text-muted">{r.token}</code>
              </td>
              <td className="py-2">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block size-5 rounded border border-line/50" style={{ background: r.color }} />
                  <code className="text-sm">{r.color}</code>
                </span>
              </td>
              <td className="py-2 text-right font-semibold tabular-nums">
                {r.ratio.toFixed(1)}:1 {r.min > 1 && <span className="text-sm font-normal text-muted">{r.ratio >= r.min ? `meets ${r.min}:1` : `below ${r.min}:1`}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ---------- Layout helpers ----------

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-line/40 bg-surface p-6">
      <h2 id={id} className="mb-4 text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{children}</p>;
}

// ---------- Page ----------

export function Showcase({ theme }: { theme: string }) {
  const [dialog, setDialog] = useState<null | 'dialog' | 'alertdialog'>(null);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('weiling@');
  const [reminders, setReminders] = useState({ sms: true, email: false });
  const [showSummary, setShowSummary] = useState(false);
  const announce = useAnnounce();
  const toast = useToast();
  const allReminders = reminders.sms && reminders.email;
  const someReminders = reminders.sms !== reminders.email;

  return (
    <div className="grid gap-6">
      <Section id="sc-buttons" title="Button">
        <div className="grid gap-5">
          <div>
            <Label>Variants</Label>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Delete</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
          <div>
            <Label>Sizes</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button>Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          <div>
            <Label>States</Label>
            <div className="flex flex-wrap gap-3">
              <Button
                loading={saving}
                onClick={() => {
                  setSaving(true);
                  setTimeout(() => {
                    setSaving(false);
                    announce('Saved');
                  }, 1200);
                }}
              >
                {saving ? 'Saving…' : 'Save (try me)'}
              </Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </Section>

      <Section id="sc-fields" title="TextField">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Full name" autoComplete="name" />
          <TextField label="NRIC / FIN" hint="Example: S1234567D" required />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : 'Enter an email address like name@example.com'}
            required
          />
          <TextField label="Reference number" value="BK-20261029" readOnly hint="Read only" />
        </div>
      </Section>

      <Section id="sc-choice" title="Select, Checkbox, RadioGroup, Switch">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="grid content-start gap-5">
            <Select label="Time slot" hint="Native select: the phone's own picker opens" placeholder="Choose a time" defaultValue="">
              <option value="0900">9:00 am</option>
              <option value="1400">2:00 pm</option>
            </Select>
            <Select label="Language" error="Choose a language" defaultValue="" placeholder="Choose">
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ms">Bahasa Melayu</option>
              <option value="ta">தமிழ்</option>
            </Select>
            <div className="grid gap-3">
              <Checkbox
                label="All reminders"
                checked={allReminders}
                indeterminate={someReminders}
                onChange={(e) => setReminders({ sms: e.target.checked, email: e.target.checked })}
              />
              <div className="grid gap-3 pl-9">
                <Checkbox label="SMS" hint="The day before" checked={reminders.sms} onChange={(e) => setReminders((r) => ({ ...r, sms: e.target.checked }))} />
                <Checkbox label="Email" checked={reminders.email} onChange={(e) => setReminders((r) => ({ ...r, email: e.target.checked }))} />
              </div>
              <Checkbox label="I agree to the terms" error="You must agree to continue" />
            </div>
          </div>
          <div className="grid content-start gap-6">
            <RadioGroup legend="Clinic" name="sc-clinic" variant="cards" defaultValue="tampines" hint="Cards: the whole box is the target">
              <Radio value="tampines" label="Tampines Family Clinic" description="East region" />
              <Radio value="jurong" label="Jurong West Medical Centre" description="West region" />
              <Radio value="toapayoh" label="Toa Payoh Health Hub" description="Fully booked" disabled />
            </RadioGroup>
            <RadioGroup legend="Contact me by" name="sc-contact" error="Choose how we contact you">
              <Radio value="sms" label="SMS" />
              <Radio value="call" label="Phone call" />
            </RadioGroup>
            <div className="grid gap-4">
              <Switch label="Appointment reminders" description="Applies straight away" defaultChecked />
              <Switch label="Share data with my GP" />
            </div>
          </div>
        </div>
      </Section>

      <Section id="sc-tabs" title="Tabs">
        <Tabs defaultValue="details">
          <TabList label="Example steps">
            <Tab value="details">Details</Tab>
            <Tab value="clinic">Clinic</Tab>
            <Tab value="review">Review</Tab>
            <Tab value="paid" disabled>
              Payment
            </Tab>
          </TabList>
          <TabPanel value="details">Use ← → to move between tabs, Home and End to jump. Disabled tabs are skipped.</TabPanel>
          <TabPanel value="clinic">Panels are linked to their tab with aria-controls and aria-labelledby.</TabPanel>
          <TabPanel value="review">Only the selected tab is in the Tab order (roving tabindex).</TabPanel>
          <TabPanel value="paid">Not available.</TabPanel>
        </Tabs>
      </Section>

      <Section id="sc-dialog" title="Dialog">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setDialog('dialog')}>
            Open dialog
          </Button>
          <Button variant="danger" onClick={() => setDialog('alertdialog')}>
            Open alert dialog
          </Button>
        </div>
        <Dialog
          open={dialog !== null}
          onClose={() => setDialog(null)}
          role={dialog ?? 'dialog'}
          title={dialog === 'alertdialog' ? 'Delete this booking?' : 'Booking details'}
          description={dialog === 'alertdialog' ? 'This cannot be undone.' : 'Toa Payoh Health Hub, 30 Oct 2026, 9:30 am.'}
        >
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant={dialog === 'alertdialog' ? 'danger' : 'primary'} onClick={() => setDialog(null)}>
              {dialog === 'alertdialog' ? 'Delete' : 'OK'}
            </Button>
          </div>
        </Dialog>
      </Section>

      <Section id="sc-accordion" title="Accordion">
        <Accordion type="single" defaultValue={['bring']} headingLevel={3}>
          <AccordionItem value="bring" title="What should I bring?">
            Headers are real headings, so screen-reader users can jump between them. ↑ ↓ Home End move focus.
          </AccordionItem>
          <AccordionItem value="cancel" title="Can I cancel?">
            type=&quot;single&quot; closes the others; type=&quot;multiple&quot; lets several stay open.
          </AccordionItem>
          <AccordionItem value="pay" title="How do I pay?" disabled>
            Not available.
          </AccordionItem>
        </Accordion>
      </Section>

      <Section id="sc-feedback" title="Alert, ErrorSummary, Toast">
        <div className="grid gap-4">
          <Alert tone="info" title="Clinic hours changed">
            Open 8 am to 9 pm from 1 November.
          </Alert>
          <Alert tone="success" title="Booking confirmed" />
          <Alert tone="warning" title="Bring your NRIC">
            Screen readers hear &quot;Warning:&quot; first, so the tone is not colour alone.
          </Alert>
          <Alert tone="danger" title="Payment failed">
            Your card was not charged.
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setShowSummary((v) => !v)}>
              {showSummary ? 'Hide error summary' : 'Show error summary'}
            </Button>
            <Button variant="secondary" onClick={() => toast({ title: 'Saved', description: 'Your changes are saved.', tone: 'success' })}>
              Show toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast({ title: 'Booking cancelled', action: { label: 'Undo', onClick: () => announce('Booking restored') } })}
            >
              Toast with action
            </Button>
          </div>
          {showSummary && (
            <ErrorSummary
              errors={[
                { id: 'sc-err-name', message: 'Enter your full name' },
                { id: 'sc-err-nric', message: 'Enter a valid NRIC or FIN' },
              ]}
            />
          )}
          {showSummary && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="sc-err-name" label="Full name" error="Enter your full name" />
              <TextField id="sc-err-nric" label="NRIC / FIN" error="Enter a valid NRIC or FIN" />
            </div>
          )}
        </div>
      </Section>

      <Section id="sc-tokens" title="Design tokens">
        <TokenTable theme={theme} />
      </Section>
    </div>
  );
}
