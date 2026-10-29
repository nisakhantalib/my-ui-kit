import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from './RadioGroup.js';

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  tags: ['autodocs'],
  args: {
    legend: 'Clinic',
    name: 'clinic',
    variant: 'cards',
    defaultValue: 'tampines',
    hint: 'Pick the one nearest you',
    children: (
      <>
        <Radio value="tampines" label="Tampines Family Clinic" description="East region" />
        <Radio value="jurong" label="Jurong West Medical Centre" description="West region" />
        <Radio value="toapayoh" label="Toa Payoh Health Hub" description="Fully booked" disabled />
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
