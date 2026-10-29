import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useKit } from '../i18n.js';
import { AmountInput, type AmountInputProps } from './AmountInput.js';

function AmountDemo(args: AmountInputProps) {
  const kit = useKit();
  const [value, setValue] = useState<number | null>(12345);
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <AmountInput {...args} value={value} onValueChange={setValue} />
      <p style={{ margin: 0, color: 'var(--kit-text-muted)' }}>
        Stored value: <code>{String(value)}</code> minor units {value !== null && <>= {kit.formatMoney(value)}</>}
      </p>
    </div>
  );
}

const meta = {
  title: 'Banking/AmountInput',
  component: AmountInput,
  tags: ['autodocs'],
  args: { label: 'Amount', hint: 'Daily transfer limit applies', required: true },
  render: (args) => <AmountDemo {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'Stores **integer minor units** (cents), so floating-point errors can never reach a payment. Switch the **Market** toolbar: separators, decimals (rupiah has none) and the spoken currency follow the locale. ' +
          'Not `type="number"`: it accepts `1e5`, loses grouping, changes on scroll, and is read inconsistently by screen readers.',
      },
    },
  },
} satisfies Meta<typeof AmountInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = { args: { error: 'That is more than your available balance' } };
