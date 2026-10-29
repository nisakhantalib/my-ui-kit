import { useState } from 'react';
import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from './test-setup.js';
import {
  AmountInput,
  Badge,
  Combobox,
  DataTable,
  ErrorSummary,
  KitProvider,
  MaskedValue,
  OTPInput,
  Skeleton,
  ToastProvider,
  brandTokens,
  contrastReport,
  useKit,
  type Column,
} from './index.js';
import type { ReactNode } from 'react';

const inMarket = (locale: string, currency: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <KitProvider locale={locale} currency={currency}>
        {children}
      </KitProvider>
    );
  };

// ---------------- KitProvider: money and words ----------------
describe('useKit money helpers', () => {
  it('parses exactly, in minor units, with each locale’s separators', () => {
    const sg = renderHook(() => useKit(), { wrapper: inMarket('en-SG', 'SGD') }).result.current;
    expect(sg.parseMoney('1,234.50')).toBe(123450);
    expect(sg.parseMoney('19.99')).toBe(1999); // not 1998.9999…
    expect(sg.parseMoney('0.1')).toBe(10);
    expect(sg.parseMoney('12.345')).toBeNull(); // more decimals than SGD has
    expect(sg.parseMoney('1e5')).toBeNull();
    expect(sg.parseMoney('-5')).toBeNull();

    const idr = renderHook(() => useKit(), { wrapper: inMarket('id-ID', 'IDR') }).result.current;
    expect(idr.currencyDigits()).toBe(0);
    expect(idr.parseMoney('1.500.000')).toBe(1_500_000); // "." groups digits in Indonesian
    expect(idr.parseMoney('1500,5')).toBeNull(); // rupiah has no cents
  });

  it('formats minor units for the market', () => {
    const hk = renderHook(() => useKit(), { wrapper: inMarket('zh-HK', 'HKD') }).result.current;
    expect(hk.formatMoney(123450)).toMatch(/1,234\.50/);
    expect(hk.formatMoney(123450, { display: 'code' })).toContain('HKD');
    const inr = renderHook(() => useKit(), { wrapper: inMarket('en-IN', 'INR') }).result.current;
    expect(inr.formatMoney(12345600, { display: 'none' })).toBe('1,23,456.00'); // lakh grouping
  });

  it('translates the library’s own words, with plurals', () => {
    const zh = renderHook(() => useKit(), { wrapper: inMarket('zh-TW', 'TWD') }).result.current;
    expect(zh.t('toast.region')).toBe('通知');
    const en = renderHook(() => useKit()).result.current; // no provider: English defaults
    expect(en.t('combobox.results', { count: 0 })).toBe('No results');
    expect(en.t('combobox.results', { count: 1 })).toBe('1 result available');
    expect(en.t('combobox.results', { count: 3 })).toBe('3 results available');
  });

  it('components pick up the market language', () => {
    render(
      <KitProvider locale="id-ID" currency="IDR">
        <ToastProvider>
          <ErrorSummary errors={[{ id: 'a', message: 'Isi nama' }]} focusOnShow={false} />
        </ToastProvider>
      </KitProvider>,
    );
    expect(screen.getByRole('region', { name: 'Notifikasi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Ada masalah ?\(1 kesalahan\)$/ })).toBeInTheDocument();
  });
});

// ---------------- Tokens ----------------
describe('design tokens', () => {
  it('every brand implements the same contract', () => {
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(brandTokens.orchid.color)).toEqual(keys(brandTokens.civic.color));
    expect(keys(brandTokens.orchid.component)).toEqual(keys(brandTokens.civic.component));
  });

  it('every required colour pair passes WCAG in every brand and mode', () => {
    expect(contrastReport.filter((r) => !r.pass)).toEqual([]);
    expect(new Set(contrastReport.map((r) => `${r.brand}/${r.mode}`)).size).toBe(4);
  });
});

// ---------------- AmountInput ----------------
describe('AmountInput', () => {
  function Harness({ onValueChange }: { onValueChange?: (v: number | null) => void }) {
    const [value, setValue] = useState<number | null>(null);
    return (
      <>
        <AmountInput
          label="Amount"
          hint="Daily limit S$5,000"
          value={value}
          onValueChange={(v) => {
            setValue(v);
            onValueChange?.(v);
          }}
        />
        <output data-testid="minor">{String(value)}</output>
      </>
    );
  }

  it('stores minor units and groups digits when you leave the field', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    await user.type(input, '1234.5');
    expect(onValueChange).toHaveBeenLastCalledWith(123450);
    await user.tab();
    expect(input).toHaveValue('1,234.50');
  });

  it('select-all and retype replaces the amount (focus never rewrites the text)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    await user.type(input, '20000');
    await user.tab();
    expect(input).toHaveValue('20,000.00');
    await user.tripleClick(input); // regression: reformatting on focus used to drop this selection
    await user.keyboard('6000');
    expect(input).toHaveValue('6000');
    expect(onValueChange).toHaveBeenLastCalledWith(600000);
    await user.clear(input);
    await user.type(input, '1,500.25'); // grouped input is accepted too
    expect(onValueChange).toHaveBeenLastCalledWith(150025);
  });

  it('speaks the currency and the hint as its description', () => {
    render(<Harness />);
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAccessibleDescription(
      'Currency: Singapore Dollar Daily limit S$5,000',
    );
  });

  it('shows a built-in error for text that is not an amount', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    await user.type(input, '12.345');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Enter an amount like 1,234\.50/);
    expect(screen.getByTestId('minor')).toHaveTextContent('null');
  });

  it('follows the market: rupiah has no decimals and uses "." for grouping', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <KitProvider locale="id-ID" currency="IDR">
        <AmountInput label="Jumlah" onValueChange={onValueChange} />
      </KitProvider>,
    );
    const input = screen.getByRole('textbox', { name: 'Jumlah' });
    expect(input).toHaveAttribute('inputmode', 'numeric');
    await user.type(input, '250000');
    await user.tab();
    expect(input).toHaveValue('250.000');
    expect(onValueChange).toHaveBeenLastCalledWith(250000);
  });

  it('has no axe violations', async () => {
    const { container } = render(<AmountInput label="Amount" error="Enter an amount" />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- OTPInput ----------------
describe('OTPInput', () => {
  afterEach(() => vi.useRealTimers());

  it('is one labelled input set up for SMS autofill, digits only', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OTPInput label="One-time password" hint="Sent to •••• 4321" onComplete={onComplete} />);
    const input = screen.getByRole('textbox', { name: 'One-time password' });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAccessibleDescription('Sent to •••• 4321');
    await user.type(input, '12a34-56');
    expect(input).toHaveValue('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('accepts a pasted code', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OTPInput label="Code" onComplete={onComplete} />);
    await user.click(screen.getByRole('textbox'));
    await user.paste('987 654');
    expect(onComplete).toHaveBeenCalledWith('987654');
  });

  it('unlocks resend after the countdown, announces it once, and resends', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onResend = vi.fn();
    render(<OTPInput label="Code" resendAfter={3} onResend={onResend} />);
    expect(screen.getByText('Resend code in 3s')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resend code' })).not.toBeInTheDocument();
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('status')).toHaveTextContent('You can now request a new code');
    await user.click(screen.getByRole('button', { name: 'Resend code' }));
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('A new code has been sent');
    expect(screen.getByText('Resend code in 3s')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<OTPInput label="Code" error="That code is wrong" resendAfter={30} />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- Combobox ----------------
const PAYEES = [
  { id: 'p1', name: 'Tan Wei Ling', account: '…4821' },
  { id: 'p2', name: 'Lim Jia Hui', account: '…0193' },
  { id: 'p3', name: 'SP Group (utilities)', account: 'UEN 199504470N' },
];

function Payees({ onValueChange }: { onValueChange?: (key: string | null) => void }) {
  return (
    <>
      <Combobox
        label="Pay to"
        hint="Search by name"
        items={PAYEES}
        getKey={(p) => p.id}
        getLabel={(p) => p.name}
        renderOption={(p) => (
          <>
            {p.name} <small>{p.account}</small>
          </>
        )}
        onValueChange={(key) => onValueChange?.(key)}
      />
      <button type="button">Next</button>
    </>
  );
}

describe('Combobox', () => {
  it('follows the APG combobox roles and states', async () => {
    const user = userEvent.setup();
    render(<Payees />);
    const input = screen.getByRole('combobox', { name: 'Pay to' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: 'Pay to' });
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(3);
    // Focus stays in the input; the highlighted option is referenced, not focused.
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
  });

  it('filters as you type, announces the count, and selects with Enter', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Payees onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox');
    await user.type(input, 't');
    expect(screen.getAllByRole('option')).toHaveLength(2); // Tan Wei Ling, SP Group (utilities)
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2 results available'));
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('p3');
    expect(input).toHaveValue('SP Group (utilities)');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('Escape closes first, then clears; free text is reverted on blur', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Payees onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveValue('Tan Wei Ling');
    await user.clear(input);
    await user.type(input, 'nobody');
    expect(screen.getByText('No matches')).toBeInTheDocument();
    await user.tab(); // leaves with text that isn't an option
    expect(input).toHaveValue('Tan Wei Ling');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue('');
  });

  it('selects with the mouse without losing focus', async () => {
    const user = userEvent.setup();
    render(<Payees />);
    await user.click(screen.getByRole('button', { name: 'Show options' }));
    await user.click(screen.getByRole('option', { name: /SP Group/ }));
    expect(screen.getByRole('combobox')).toHaveValue('SP Group (utilities)');
  });

  it('has no axe violations while open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Payees />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await expectNoA11yViolations(container);
  });
});

// ---------------- DataTable ----------------
type Txn = { id: string; date: string; desc: string; amount: number };
const TXNS: Txn[] = [
  { id: '1', date: '2026-10-27', desc: 'NTUC FairPrice', amount: -8640 },
  { id: '2', date: '2026-10-28', desc: 'Salary', amount: 520000 },
  { id: '3', date: '2026-10-26', desc: 'Grab', amount: -1490 },
];
const COLUMNS: Column<Txn>[] = [
  { key: 'date', header: 'Date', cell: (t) => t.date, sortValue: (t) => t.date },
  { key: 'desc', header: 'Description', cell: (t) => t.desc, rowHeader: true },
  {
    key: 'amount',
    header: 'Amount',
    cell: (t) => (t.amount / 100).toFixed(2),
    sortValue: (t) => t.amount,
    align: 'end',
  },
];

describe('DataTable', () => {
  it('is a captioned table with row headers, sortable by button with aria-sort', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        caption="Recent transactions"
        columns={COLUMNS}
        rows={TXNS}
        getRowKey={(t) => t.id}
        defaultSort={{ key: 'date', direction: 'descending' }}
      />,
    );
    const table = screen.getByRole('table', { name: /Recent transactions/ });
    expect(screen.getByRole('columnheader', { name: /Date/ })).toHaveAttribute('aria-sort', 'descending');
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((c) => c.textContent),
    ).toEqual(['Salary', 'NTUC FairPrice', 'Grab']);
    expect(screen.getByRole('region', { name: /Recent transactions/ })).toHaveAttribute('tabindex', '0');

    await user.click(screen.getByRole('button', { name: /Amount/ }));
    expect(screen.getByRole('columnheader', { name: /Amount/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: /Date/ })).not.toHaveAttribute('aria-sort');
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((c) => c.textContent),
    ).toEqual(['NTUC FairPrice', 'Grab', 'Salary']);
    expect(table).toHaveAccessibleName('Recent transactions, Sorted by Amount, ascending');
  });

  it('shows an empty state', () => {
    render(<DataTable caption="Transactions" columns={COLUMNS} rows={[]} getRowKey={(t) => t.id} />);
    expect(screen.getByRole('cell', { name: 'Nothing to show' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<DataTable caption="Recent" columns={COLUMNS} rows={TXNS} getRowKey={(t) => t.id} />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- MaskedValue, Badge, Skeleton ----------------
describe('MaskedValue', () => {
  it('says "ending 6789" when masked, and is a pressed toggle when shown', async () => {
    render(<MaskedValue value="0123456789" label="account number" />);
    expect(screen.getByText('account number ending 6789')).toBeInTheDocument();
    expect(screen.queryByText('0123 4567 89')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show account number' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('0123 4567 89')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<MaskedValue value="0123456789" label="account number" />);
    await expectNoA11yViolations(container);
  });
});

describe('Badge and Skeleton', () => {
  it('badge is text, skeleton is hidden from assistive tech', async () => {
    const { container } = render(
      <div aria-busy="true">
        <Badge tone="warning">Pending</Badge>
        <Skeleton lines={3} />
      </div>,
    );
    expect(screen.getByText('Pending')).toBeVisible();
    expect(container.querySelector('.kit-skeleton-group')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });
});

describe('deprecations', () => {
  it('ErrorSummary autoFocus still works but warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errors = [{ id: 'x', message: 'Fix this' }];
    const { rerender } = render(<ErrorSummary errors={errors} autoFocus={false} />);
    rerender(<ErrorSummary errors={errors} autoFocus={false} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('use `focusOnShow`'.replace('use', 'Use'));
    expect(screen.getByRole('heading').parentElement).not.toHaveFocus(); // autoFocus={false} honoured
    warn.mockRestore();
  });
});
