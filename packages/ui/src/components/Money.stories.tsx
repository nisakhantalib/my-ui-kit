import type { Meta, StoryObj } from '@storybook/react-vite';
import { Money } from './Money.js';

const meta = {
  title: 'Banking/Money',
  component: Money,
  tags: ['autodocs'],
  args: { value: 6069055 },
  decorators: [(Story) => <div style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>{Story()}</div>],
  parameters: {
    docs: {
      description: {
        component:
          'A headline amount in the market format, with the cents de-emphasised so the figure that matters reads first. Integer minor units in; one run of text out, so screen readers hear the whole amount.',
      },
    },
  },
} satisfies Meta<typeof Money>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Balance: Story = {};
export const Debit: Story = { args: { value: -680, signDisplay: 'exceptZero' } };
export const CurrencyCode: Story = { args: { currency: 'HKD', display: 'code' } };
export const Plain: Story = { args: { emphasiseMajor: false } };
