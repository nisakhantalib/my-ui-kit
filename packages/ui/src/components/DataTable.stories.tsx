import type { Meta, StoryObj } from '@storybook/react-vite';
import { useKit } from '../i18n.js';
import { Badge } from './Badge.js';
import { DataTable, type Column } from './DataTable.js';

type Txn = { id: string; date: string; desc: string; amount: number; status: 'posted' | 'pending' };
const TXNS: Txn[] = [
  { id: '1', date: '2026-10-28', desc: 'Salary — Acme Pte Ltd', amount: 520000, status: 'posted' },
  { id: '2', date: '2026-10-27', desc: 'NTUC FairPrice', amount: -8640, status: 'posted' },
  { id: '3', date: '2026-10-27', desc: 'Grab ride', amount: -1490, status: 'pending' },
  { id: '4', date: '2026-10-25', desc: 'SP Group', amount: -13520, status: 'posted' },
];

function TableDemo({ empty }: { empty?: boolean }) {
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
      rows={empty ? [] : TXNS}
      getRowKey={(t) => t.id}
      defaultSort={{ key: 'date', direction: 'descending' }}
    />
  );
}

const meta = {
  title: 'Banking/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A real `<table>` with caption, row headers and sort buttons in the headers (`aria-sort`). The sort is also stated in the caption, because `aria-sort` changes are not announced everywhere. Scrolls inside a focusable region on narrow screens.',
      },
    },
  },
} satisfies Meta<typeof DataTable>;

export default meta;
export const Transactions: StoryObj = { render: () => <TableDemo /> };
export const Empty: StoryObj = { render: () => <TableDemo empty /> };
