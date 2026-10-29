import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combobox, type ComboboxProps } from './Combobox.js';

type Payee = { id: string; name: string; detail: string };
const PAYEES: Payee[] = [
  { id: 'p1', name: 'Tan Wei Ling', detail: 'Orchid Bank ···· 4821' },
  { id: 'p2', name: 'Lim Jia Hui', detail: 'PayNow +65 •••• 0193' },
  { id: 'p3', name: 'SP Group', detail: 'UEN 199504470N · Utilities' },
  { id: 'p4', name: 'Rahman bin Ismail', detail: 'Orchid Bank ···· 7730' },
  { id: 'p5', name: 'Priya Nair', detail: 'PayNow +65 •••• 5512' },
];

const meta = {
  title: 'Banking/Combobox',
  component: Combobox<Payee>,
  tags: ['autodocs'],
  args: {
    label: 'Pay to',
    hint: 'Search saved payees by name',
    placeholder: 'Name, mobile or UEN',
    items: PAYEES,
    getKey: (p: Payee) => p.id,
    getLabel: (p: Payee) => p.name,
    filter: (p: Payee, q: string) => `${p.name} ${p.detail}`.toLowerCase().includes(q.toLowerCase()),
    renderOption: (p: Payee) => (
      <span style={{ display: 'grid' }}>
        <span>{p.name}</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--kit-text-muted)', fontWeight: 400 }}>{p.detail}</span>
      </span>
    ),
  } satisfies ComboboxProps<Payee>,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420, minHeight: 380 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'APG combobox with listbox popup and manual selection. Focus stays in the input (`aria-activedescendant`); ↓/↑ move, Enter selects, Escape closes then clears; the result count is announced politely; leaving with unmatched text restores the last choice.',
      },
    },
  },
} satisfies Meta<typeof Combobox<Payee>>;

export default meta;
export const PayeeSearch: StoryObj<typeof meta> = {};
export const WithError: StoryObj<typeof meta> = { args: { error: 'Choose who to pay', required: true } };
