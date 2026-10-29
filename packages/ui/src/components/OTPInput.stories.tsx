import type { Meta, StoryObj } from '@storybook/react-vite';
import { OTPInput } from './OTPInput.js';

const meta = {
  title: 'Banking/OTPInput',
  component: OTPInput,
  tags: ['autodocs'],
  args: { label: 'One-time password', hint: 'We sent it by SMS to •••• 4321', resendAfter: 30 },
  parameters: {
    docs: {
      description: {
        component:
          'One real input drawn as boxes. `autocomplete="one-time-code"` gives iOS/Android code suggestions; paste works (even "987 654"); screen readers hear one labelled field, not six. The resend countdown is announced once, when it unlocks.',
      },
    },
  },
} satisfies Meta<typeof OTPInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = { args: { error: 'That code is not right. Check the SMS and try again.' } };
