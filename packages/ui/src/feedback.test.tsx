import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from './test-setup.js';
import {
  Accordion,
  AccordionItem,
  Alert,
  Button,
  ErrorSummary,
  TextField,
  ToastProvider,
  useToast,
  type ToastOptions,
} from './index.js';

// ---------------- Accordion ----------------
function Faq({ type }: { type?: 'single' | 'multiple' }) {
  return (
    <Accordion type={type} defaultValue={['bring']} headingLevel={2}>
      <AccordionItem value="bring" title="What should I bring?">
        Your NRIC and any referral letter.
      </AccordionItem>
      <AccordionItem value="cancel" title="Can I cancel?">
        Yes, up to 24 hours before.
      </AccordionItem>
      <AccordionItem value="pay" title="How do I pay?">
        At the clinic counter.
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders each header as a heading containing an expand button', () => {
    render(<Faq />);
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(3);
    const first = within(headings[0]!).getByRole('button', { name: 'What should I bring?' });
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'What should I bring?' })).toHaveTextContent('Your NRIC');
    expect(screen.queryByRole('region', { name: 'Can I cancel?' })).not.toBeInTheDocument(); // hidden
  });

  it('multiple: items open independently', async () => {
    render(<Faq type="multiple" />);
    await userEvent.click(screen.getByRole('button', { name: 'Can I cancel?' }));
    expect(screen.getByRole('button', { name: 'What should I bring?' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Can I cancel?' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('single: opening one closes the other', async () => {
    render(<Faq type="single" />);
    await userEvent.click(screen.getByRole('button', { name: 'Can I cancel?' }));
    expect(screen.getByRole('button', { name: 'What should I bring?' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves between headers with ↑/↓, Home and End', async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const [a, b, c] = screen.getAllByRole('button');
    await user.tab();
    expect(a).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(b).toHaveFocus();
    await user.keyboard('{End}');
    expect(c).toHaveFocus();
    await user.keyboard('{ArrowDown}'); // wraps
    expect(a).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(c).toHaveFocus();
    await user.keyboard('{Home}');
    expect(a).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Faq />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- Alert ----------------
describe('Alert', () => {
  it('speaks the tone, so it is not conveyed by colour alone', () => {
    render(
      <Alert tone="warning" title="Clinic closing early">
        Last appointment is at 4 pm on Friday.
      </Alert>,
    );
    expect(screen.getByText('Clinic closing early').parentElement).toHaveTextContent('Warning: Clinic closing early');
  });

  it('has no live-region role unless asked for one', () => {
    const { rerender } = render(<Alert>Static notice</Alert>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    rerender(<Alert role="status">Saved</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Information: Saved');
  });

  it('has no axe violations in every tone', async () => {
    const { container } = render(
      <>
        {(['info', 'success', 'warning', 'danger'] as const).map((tone) => (
          <Alert key={tone} tone={tone} title={tone}>
            Body
          </Alert>
        ))}
      </>,
    );
    await expectNoA11yViolations(container);
  });
});

// ---------------- ErrorSummary ----------------
describe('ErrorSummary', () => {
  const errors = [
    { id: 'name', message: 'Enter your full name' },
    { id: 'email', message: 'Enter an email address' },
  ];

  it('takes focus, states the count, and links move focus to the field', async () => {
    render(
      <>
        <ErrorSummary errors={errors} />
        <TextField id="name" label="Full name" />
        <TextField id="email" label="Email" />
      </>,
    );
    const heading = screen.getByRole('heading', { name: 'There is a problem, 2 errors' });
    expect(heading.parentElement).toHaveFocus();

    Element.prototype.scrollIntoView = vi.fn(); // not implemented in jsdom
    await userEvent.click(screen.getByRole('link', { name: 'Enter an email address' }));
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('renders nothing when there are no errors', () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ErrorSummary errors={errors} autoFocus={false} />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- Toast ----------------
function ToastHarness({ options }: { options: ToastOptions }) {
  const toast = useToast();
  return <Button onClick={() => toast(options)}>Show</Button>;
}

describe('Toast', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the toast and announces it through a pre-existing live region', async () => {
    render(
      <ToastProvider>
        <ToastHarness options={{ title: 'Booking saved', description: 'See you on 30 Oct', tone: 'success' }} />
      </ToastProvider>,
    );
    const live = screen.getByRole('status');
    expect(live).toBeEmptyDOMElement(); // exists before any toast
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(within(region).getByText('Booking saved')).toBeInTheDocument();
    await vi.waitFor(() => expect(live).toHaveTextContent('Booking saved. See you on 30 Oct'));
  });

  it('auto-dismisses after its duration, and can be dismissed by its close button', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastHarness options={{ title: 'Copied', duration: 3000 }} />
      </ToastProvider>,
    );
    // Scope to the visible region: the text also lives on in the screen-reader live region.
    const region = screen.getByRole('region', { name: 'Notifications' });
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(within(region).getByText('Copied')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3100));
    expect(within(region).queryByText('Copied')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss: Copied' }));
    expect(within(region).queryByText('Copied')).not.toBeInTheDocument();
  });

  it('never times out when it has an action (WCAG 2.2.1)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const undo = vi.fn();
    render(
      <ToastProvider>
        <ToastHarness options={{ title: 'Booking cancelled', action: { label: 'Undo', onClick: undo } }} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show' }));
    act(() => vi.advanceTimersByTime(60_000));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(within(screen.getByRole('region', { name: 'Notifications' })).queryByText('Booking cancelled')).not.toBeInTheDocument();
  });

  it('throws a helpful error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ToastHarness options={{ title: 'x' }} />)).toThrow('useToast must be used inside <ToastProvider>.');
    vi.restoreAllMocks();
  });

  it('has no axe violations with a toast showing', async () => {
    render(
      <ToastProvider>
        <ToastHarness options={{ title: 'Saved', action: { label: 'Undo', onClick: () => {} } }} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    await expectNoA11yViolations(document.body);
  });
});
