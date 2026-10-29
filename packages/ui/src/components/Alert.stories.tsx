import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert.js';

const meta = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: { tone: 'info', title: 'Clinic hours changed', children: 'Open 8 am to 9 pm from 1 November.' },
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
export const Success: Story = { args: { tone: 'success', title: 'Booking confirmed', children: undefined } };
export const Warning: Story = {
  args: { tone: 'warning', title: 'Bring your NRIC', children: 'You will be asked for it at the counter.' },
};
export const Danger: Story = {
  args: { tone: 'danger', title: 'Payment failed', children: 'Your card was not charged.' },
};
