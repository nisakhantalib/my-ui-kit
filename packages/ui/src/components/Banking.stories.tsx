import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useKit } from '../i18n.js';
import { AmountInput } from './AmountInput.js';
import { Badge, Skeleton } from './Badge.js';
import { Combobox } from './Combobox.js';
import { DataTable, type Column } from './DataTable.js';
import { MaskedValue } from './MaskedValue.js';
import { OTPInput } from './OTPInput.js';

const meta = {
  title: 'Banking/AmountInput',
  component: AmountInput,
  tags: ['autodocs'],
  args: { label: 'Amount', hint: 'Daily transfer limit applies', required: true },
  parameters: {
    docs: {
      description: {
        component:
          'Money input that stores **integer minor units** (cents), so floating-point errors can never reach a payment. ' +
          'Switch the **Market** toolbar: separators, decimals (rupiah has none) and the spoken currency all follow the locale.\n\n' +
          'Why not `type="number"`: it accepts `1e5`, loses grouping, changes value on scroll, and screen readers read it inconsistently.',
      },
    },
  },
} satisfies Meta<typeof AmountInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function AmountDemo(args: Story['args']) {
  const kit = useKit();
  const [value, setValue] = useState<number | null>(12345);
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <AmountInput label="Amount" {...args} value={value} onValueChange={setValue} />
      <p style={{ margin: 0, color: 'var(--kit-text-muted)' }}>
        Stored value: <code>{String(value)}</code> minor units {value !== null && <>= {kit.formatMoney(value)}</>}
      </p>
    </div>
  );
}

export const Default: Story = { render: (args) => <AmountDemo {...args} /> };
export const WithError: Story = {
  args: { error: 'That is more than your available balance' },
  render: (args) => <AmountDemo {...args} />,
};

export const OneTimePassword: StoryObj<typeof OTPInput> = {
  name: 'OTPInput',
  parameters: {
    docs: {
      description: {
        story:
          'One real input drawn as six boxes: `autocomplete="one-time-code"` gives iOS/Android code suggestions, paste works, and screen readers hear one labelled field.',
      },
    },
  },
  render: () => <OTPInput label="One-time password" hint="We sent it by SMS to •••• 4321" resendAfter={30} />,
};

const PAYEES = [
  { id: 'p1', name: 'Tan Wei Ling', detail: 'Orchid Bank ···· 4821' },
  { id: 'p2', name: 'Lim Jia Hui', detail: 'PayNow +65 •••• 0193' },
  { id: 'p3', name: 'SP Group', detail: 'UEN 199504470N · Utilities' },
  { id: 'p4', name: 'Rahman bin Ismail', detail: 'Orchid Bank ···· 7730' },
  { id: 'p5', name: 'Priya Nair', detail: 'PayNow +65 •••• 5512' },
];

export const PayeeCombobox: StoryObj = {
  name: 'Combobox (payee search)',
  render: () => (
    <div style={{ maxWidth: 420, minHeight: 360 }}>
      <Combobox
        label="Pay to"
        hint="Search saved payees by name"
        placeholder="Name, mobile or UEN"
        items={PAYEES}
        getKey={(p) => p.id}
        getLabel={(p) => p.name}
        filter={(p, q) => `${p.name} ${p.detail}`.toLowerCase().includes(q.toLowerCase())}
        renderOption={(p) => (
          <span style={{ display: 'grid' }}>
            <span>{p.name}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--kit-text-muted)', fontWeight: 400 }}>{p.detail}</span>
          </span>
        )}
      />
    </div>
  ),
};

type Txn = { id: string; date: string; desc: string; category: string; amount: number; status: 'posted' | 'pending' };
const TXNS: Txn[] = [
  { id: '1', date: '2026-10-28', desc: 'Salary — Acme Pte Ltd', category: 'Income', amount: 520000, status: 'posted' },
  { id: '2', date: '2026-10-27', desc: 'NTUC FairPrice', category: 'Groceries', amount: -8640, status: 'posted' },
  { id: '3', date: '2026-10-27', desc: 'Grab ride', category: 'Transport', amount: -1490, status: 'pending' },
  { id: '4', date: '2026-10-25', desc: 'SP Group', category: 'Utilities', amount: -13520, status: 'posted' },
];

function TableDemo() {
  const kit = useKit();
  const columns: Column<Txn>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (t) => kit.formatDate(t.date, { day: 'numeric', month: 'short' }),
      sortValue: (t) => t.date,
    },
    { key: 'desc', header: 'Description', cell: (t) => t.desc, rowHeader: true, sortValue: (t) => t.desc },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => (
        <Badge tone={t.status === 'pending' ? 'warning' : 'success'}>
          {t.status === 'pending' ? 'Pending' : 'Posted'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (t) => kit.formatMoney(t.amount, { signDisplay: 'exceptZero' }),
      sortValue: (t) => t.amount,
    },
  ];
  return (
    <DataTable
      caption="Recent transactions"
      columns={columns}
      rows={TXNS}
      getRowKey={(t) => t.id}
      defaultSort={{ key: 'date', direction: 'descending' }}
    />
  );
}

export const TransactionsTable: StoryObj = { name: 'DataTable', render: () => <TableDemo /> };

export const Masked: StoryObj = {
  name: 'MaskedValue',
  render: () => (
    <p style={{ fontSize: '1.125rem' }}>
      Everyday Account <MaskedValue value="0123456789" label="account number" />
    </p>
  ),
};

export const BadgesAndSkeletons: StoryObj = {
  name: 'Badge and Skeleton',
  render: () => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge>Draft</Badge>
        <Badge tone="info">Scheduled</Badge>
        <Badge tone="success">Received</Badge>
        <Badge tone="warning">Pending</Badge>
        <Badge tone="danger">Failed</Badge>
      </div>
      <div aria-busy="true" aria-label="Loading accounts" role="group" style={{ display: 'grid', gap: 12 }}>
        <Skeleton shape="block" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton shape="circle" />
          <div style={{ flex: 1 }}>
            <Skeleton lines={2} />
          </div>
        </div>
      </div>
    </div>
  ),
};
