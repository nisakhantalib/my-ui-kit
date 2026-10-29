import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import axe from 'axe-core';
import { Button, Dialog, Tab, TabList, TabPanel, Tabs, TextField } from './index.js';
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
