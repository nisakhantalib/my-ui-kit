import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import axe from 'axe-core';
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
} from './index.js';
import './styles.css';

/**
 * These run in real Chromium (Vitest Browser Mode), so they cover what jsdom cannot:
 * computed colour contrast, real focus rings, and real keyboard events.
 */

async function axeViolations(root: Element = document.body) {
  // Full WCAG 2.0/2.1/2.2 A + AA rule set, including color-contrast.
  const { violations } = await axe.run(root, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  });
  return violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.map((n) => n.target.join(" ") + " " + n.any.map((a) => a.message).join(";")).join(" | ")}`);
}

/** WCAG 2.x contrast ratio between two computed rgb() colours. */
function contrastRatio(a: string, b: string): number {
  const lum = (rgb: string) => {
    const [r, g, bl] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function Showcase() {
  const [open, setOpen] = useState(false);
  return (
    <main style={{ background: 'var(--kit-bg)', color: 'var(--kit-text)', padding: 16 }}>
      <h1>Showcase</h1>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <TextField label="Email" hint="We send the receipt here" error="Enter an email address" required />
      <Tabs defaultValue="a">
        <TabList label="Steps">
          <Tab value="a">Details</Tab>
          <Tab value="b">Review</Tab>
        </TabList>
        <TabPanel value="a">Panel A</TabPanel>
        <TabPanel value="b">Panel B</TabPanel>
      </Tabs>
      <Select label="Time slot" hint="Morning fills up first" error="Choose a time slot" defaultValue="">
        <option value="">Choose</option>
        <option value="0930">9:30 am</option>
      </Select>
      <Checkbox label="Send me a reminder" hint="One SMS the day before" />
      <Checkbox label="I agree" error="You must agree" />
      <RadioGroup legend="Clinic" name="clinic" variant="cards" defaultValue="a" error="Choose a clinic">
        <Radio value="a" label="Tampines" description="East" />
        <Radio value="b" label="Jurong West" description="West" />
      </RadioGroup>
      <Switch label="Email reminders" description="Sent the day before" />
      <Switch label="SMS reminders" defaultChecked />
      <Accordion defaultValue={['a']} headingLevel={2}>
        <AccordionItem value="a" title="What should I bring?">Your NRIC.</AccordionItem>
        <AccordionItem value="b" title="Can I cancel?">Yes.</AccordionItem>
      </Accordion>
      {(['info', 'success', 'warning', 'danger'] as const).map((tone) => (
        <Alert key={tone} tone={tone} title={`Tone ${tone}`}>
          Body text in the {tone} tone.
        </Alert>
      ))}
      <ErrorSummary errors={[{ id: 'x', message: 'Enter your full name' }]} autoFocus={false} />
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Confirm" description="Are you sure?">
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Dialog>
    </main>
  );
}

describe('in a real browser', () => {
  it('meets WCAG 2.2 AA automated checks, including colour contrast', async () => {
    await render(<Showcase />);
    expect(await axeViolations()).toEqual([]);
  });

  it('meets WCAG 2.2 AA in the dark theme too (every variant)', async () => {
    document.documentElement.dataset.theme = 'dark';
    try {
      await render(<Showcase />);
      expect(await axeViolations()).toEqual([]);
    } finally {
      delete document.documentElement.dataset.theme;
    }
  });

  it('shows a visible focus ring for keyboard users only', async () => {
    await render(<Button>Focus me</Button>);
    await userEvent.tab();
    const btn = page.getByRole('button', { name: 'Focus me' });
    await expect.element(btn).toHaveFocus();
    const outline = getComputedStyle(btn.element()).outlineStyle;
    expect(outline).toBe('solid'); // WCAG 2.4.7 Focus Visible
  });

  it('focus ring has ≥ 3:1 contrast against bg and surface in both themes (WCAG 1.4.11)', async () => {
    await render(<Button>Focus me</Button>);
    await userEvent.tab(); // keyboard focus, so :focus-visible applies and we measure the real ring
    const btn = page.getByRole('button', { name: 'Focus me' }).element();
    expect(getComputedStyle(btn).outlineStyle).toBe('solid');
    for (const theme of ['light', 'dark']) {
      document.documentElement.dataset.theme = theme;
      const ring = getComputedStyle(btn).outlineColor;
      for (const bgToken of ['--kit-bg', '--kit-surface']) {
        const probe = document.createElement('span');
        probe.style.color = `var(${bgToken})`;
        document.body.append(probe);
        const ratio = contrastRatio(ring, getComputedStyle(probe).color);
        probe.remove();
        expect(ratio, `${theme} theme, ring vs ${bgToken}`).toBeGreaterThanOrEqual(3);
      }
    }
    delete document.documentElement.dataset.theme;
  });

  it('checkbox, radio and switch targets are at least 24×24px (WCAG 2.5.8)', async () => {
    await render(<Showcase />);
    const targets = [
      page.getByRole('checkbox', { name: 'Send me a reminder' }),
      page.getByRole('radio', { name: 'Tampines' }),
      page.getByRole('switch', { name: 'Email reminders' }),
    ];
    for (const t of targets) {
      const { width, height } = t.element().getBoundingClientRect();
      expect(Math.min(width, height)).toBeGreaterThanOrEqual(24);
    }
  });

  it('switch toggles with a real Space key press', async () => {
    await render(<Switch label="Email reminders" />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    await expect.element(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('meets the 24px minimum target size (WCAG 2.5.8) — ours are 44px', async () => {
    await render(<Button size="sm">Small</Button>);
    const { height } = page.getByRole('button', { name: 'Small' }).element().getBoundingClientRect();
    expect(height).toBeGreaterThanOrEqual(24);
  });

  it('traps focus in the dialog with real Tab presses', async () => {
    await render(<Showcase />);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    const close = page.getByRole('button', { name: 'Close' });
    await expect.element(close).toHaveFocus();
    await userEvent.tab();
    await expect.element(close).toHaveFocus(); // only one focusable item, so focus stays put
    // Let the open animation finish before measuring contrast.
    await Promise.all(document.getAnimations().map((a) => a.finished));
    expect(await axeViolations()).toEqual([]);
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('button', { name: 'Open dialog' })).toHaveFocus();
  });
});
