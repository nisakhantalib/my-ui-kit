import type { Meta, StoryObj } from '@storybook/react-vite';
import { MaskedValue } from './MaskedValue.js';

const meta = {
  title: 'Banking/MaskedValue',
  component: MaskedValue,
  tags: ['autodocs'],
  args: { value: '0123456789', label: 'account number' },
  parameters: {
    docs: {
      description: {
        component:
          'Masked, screen readers hear "account number ending 6789", not a row of bullets. The toggle keeps a constant label with `aria-pressed` (APG toggle button).',
      },
    },
  },
} satisfies Meta<typeof MaskedValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Masked: Story = {};
export const Revealed: Story = { args: { defaultRevealed: true } };
