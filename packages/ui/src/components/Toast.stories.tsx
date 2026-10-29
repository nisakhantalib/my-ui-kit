import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.js';
import { ToastProvider, useToast } from './Toast.js';

function ToastDemo() {
  const toast = useToast();
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button
        variant="secondary"
        onClick={() => toast({ title: 'Saved', description: 'Your changes are saved.', tone: 'success' })}
      >
        Success toast
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: 'Could not save', tone: 'danger' })}>
        Error toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: 'Booking cancelled', action: { label: 'Undo', onClick: () => {} } })}
      >
        With action (never times out)
      </Button>
    </div>
  );
}

const meta = {
  title: 'Feedback/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Announced through a live region that exists before any toast. Pauses on hover and focus; never times out when it has an action (WCAG 2.2.1); never steals focus. Put `<ToastProvider>` near the root and call `useToast()`.',
      },
    },
  },
  render: () => <ToastDemo />,
} satisfies Meta<typeof ToastProvider>;

export default meta;
export const Default: StoryObj = {};
