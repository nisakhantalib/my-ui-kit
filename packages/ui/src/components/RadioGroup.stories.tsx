import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from './RadioGroup.js';

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  tags: ['autodocs'],
  args: {
    legend: 'Pay from',
    name: 'account',
    variant: 'cards',
    defaultValue: 'everyday',
    hint: 'The money leaves this account straight away',
    children: (
      <>
        <Radio value="everyday" label="Everyday Account" description="···· 6789 · SGD 12,480.55" />
        <Radio value="savings" label="Savings Account" description="···· 8877 · SGD 48,210.00" />
        <Radio value="fixed" label="Fixed Deposit" description="Locked until 12 Mar 2027" disabled />
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Native radios in a `fieldset` with `role="radiogroup"`: Tab enters once, arrow keys move and select. Descriptions are read as descriptions, not as part of the name. See the full spec in docs/specs/components/radio-group.md.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cards: Story = {};
export const Plain: Story = {
  args: {
    legend: 'Contact me by',
    name: 'contact',
    variant: 'plain',
    defaultValue: undefined,
    hint: undefined,
    error: 'Choose how we contact you',
    required: true,
    children: (
      <>
        <Radio value="sms" label="SMS" />
        <Radio value="call" label="Phone call" />
      </>
    ),
  },
};
