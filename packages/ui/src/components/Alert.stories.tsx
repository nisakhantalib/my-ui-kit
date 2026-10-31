import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert.js';

const meta = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: { tone: 'info', title: 'Scheduled maintenance', children: 'Transfers pause from 2 am to 3 am on Sunday.' },
  parameters: {
    docs: {
      description: {
        component:
          'Which message component?\n\n' +
          '| Situation | Use |\n|---|---|\n' +
          '| Information that is on the page when it loads | `Alert` (no role) |\n' +
          '| Result of an action, user keeps working | `useToast()` |\n' +
          '| Form submitted with errors | `ErrorSummary` + field errors |\n' +
          '| User must decide before continuing | `Dialog role="alertdialog"` |\n\n' +
          'The tone is spoken ("Warning: …"), so it is never conveyed by colour alone.',
      },
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = { args: { tone: 'success', title: 'Transfer sent', children: undefined } };
export const Warning: Story = {
  args: {
    tone: 'warning',
    title: 'Unusual sign-in',
    children: 'We noticed a sign-in from a new device. If it was not you, freeze your card.',
  },
};
export const Danger: Story = {
  args: { tone: 'danger', title: 'Payment failed', children: 'Your card was not charged.' },
};
