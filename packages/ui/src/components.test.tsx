import { useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from './test-setup.js';
import {
  AnalyticsProvider,
  AnnouncerProvider,
  Button,
  Dialog,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  useAnnounce,
  type AnalyticsAdapter,
} from './index.js';

// ---------------- Button ----------------
describe('Button', () => {
  it('calls onClick and sends an analytics event when trackId is set', async () => {
    const onClick = vi.fn();
    const adapter: AnalyticsAdapter = { track: vi.fn() };
    render(
      <AnalyticsProvider adapters={[adapter]}>
        <Button trackId="book-now" onClick={onClick}>
          Book now
        </Button>
      </AnalyticsProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Book now' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(adapter.track).toHaveBeenCalledWith({
      name: 'button_click',
      properties: { component: 'Button', id: 'book-now' },
    });
  });

  it('stays focusable but blocks clicks while loading', async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    expect(btn).toHaveFocus();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Button>OK</Button>);
    await expectNoA11yViolations(container);
  });
});

// ---------------- TextField ----------------
describe('TextField', () => {
  it('links label, hint and error to the input', () => {
    render(<TextField label="NRIC / FIN" hint="Example: S1234567D" error="Enter a valid NRIC" required />);
    const input = screen.getByLabelText(/NRIC \/ FIN/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    // The ⚠ icon is aria-hidden, so screen readers hear only the words.
    expect(input).toHaveAccessibleDescription('Example: S1234567D Enter a valid NRIC');
  });

  it('is not marked invalid without an error', () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('has no axe violations in the error state', async () => {
    const { container } = render(<TextField label="Email" hint="We send the receipt here" error="Required" />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- Tabs ----------------
function DemoTabs({ activation }: { activation?: 'automatic' | 'manual' }) {
  return (
    <Tabs defaultValue="a" activation={activation}>
      <TabList label="Steps">
        <Tab value="a">Alpha</Tab>
        <Tab value="b">Beta</Tab>
        <Tab value="c">Gamma</Tab>
      </TabList>
      <TabPanel value="a">Panel A</TabPanel>
      <TabPanel value="b">Panel B</TabPanel>
      <TabPanel value="c">Panel C</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('uses roving tabindex and moves with arrow keys, Home and End', async () => {
    const user = userEvent.setup();
    render(<DemoTabs />);
    const [a, b, c] = screen.getAllByRole('tab');
    expect(a).toHaveAttribute('tabindex', '0');
    expect(b).toHaveAttribute('tabindex', '-1');

    await user.tab();
    expect(a).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B');

    await user.keyboard('{End}');
    expect(c).toHaveFocus();
    await user.keyboard('{ArrowRight}'); // wraps around
    expect(a).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(c).toHaveFocus();
    await user.keyboard('{Home}');
    expect(a).toHaveFocus();
  });

  it('manual activation waits for Enter', async () => {
    const user = userEvent.setup();
    render(<DemoTabs activation="manual" />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    const b = screen.getByRole('tab', { name: 'Beta' });
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute('aria-selected', 'false');
    await user.keyboard('{Enter}');
    expect(b).toHaveAttribute('aria-selected', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(<DemoTabs />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- Dialog ----------------
function DialogHarness() {
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete booking</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this booking?"
        description="This cannot be undone."
        role="alertdialog"
        initialFocusRef={confirmRef}
      >
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button ref={confirmRef} variant="danger" onClick={() => setOpen(false)}>Delete</Button>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('moves focus in, traps Tab, closes on Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Delete booking' });
    await user.click(trigger);

    const dialog = screen.getByRole('alertdialog', { name: 'Delete this booking?' });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const del = screen.getByRole('button', { name: 'Delete' });
    expect(del).toHaveFocus(); // initialFocusRef

    await user.tab(); // last -> wraps to first
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true }); // first -> wraps to last
    expect(del).toHaveFocus();

    // Background is inert while open, so screen readers and Tab can't reach it.
    expect(trigger.closest('body > *')).toHaveProperty('inert', true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(trigger.closest('body > *')).toHaveProperty('inert', false);
    expect(trigger).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    render(
      <Dialog open onClose={() => {}} title="Info" description="Details">
        <Button>Close</Button>
      </Dialog>,
    );
    await expectNoA11yViolations(document.body);
  });
});

// ---------------- Announcer ----------------
function AnnounceHarness() {
  const announce = useAnnounce();
  return <Button onClick={() => announce('Booking saved')}>Save</Button>;
}

describe('Announcer', () => {
  it('writes the message into a polite live region', async () => {
    render(
      <AnnouncerProvider>
        <AnnounceHarness />
      </AnnouncerProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Booking saved'));
  });
});
