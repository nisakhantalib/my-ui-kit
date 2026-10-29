import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, ErrorSummary } from './Alert.js';
import { Button } from './Button.js';
import { Dialog } from './Dialog.js';
import { TextField } from './TextField.js';
import { useToast } from './Toast.js';

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
          '| User must decide before continuing | `Dialog role="alertdialog"` |',
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

export const ErrorSummaryStory: StoryObj<typeof ErrorSummary> = {
  name: 'ErrorSummary',
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
      <ErrorSummary
        focusOnShow={false}
        errors={[
          { id: 'es-name', message: 'Enter your full name' },
          { id: 'es-nric', message: 'Enter a valid NRIC or FIN, for example S1234567D' },
        ]}
      />
      <TextField id="es-name" label="Full name" error="Enter your full name" />
      <TextField id="es-nric" label="NRIC / FIN" error="Enter a valid NRIC or FIN, for example S1234567D" />
    </div>
  ),
};

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

export const Toast: StoryObj = { render: () => <ToastDemo /> };

function DialogDemo({ role }: { role: 'dialog' | 'alertdialog' }) {
  const [open, setOpen] = useState(false);
  const confirm = useRef<HTMLButtonElement>(null);
  const destructive = role === 'alertdialog';
  return (
    <>
      <Button variant={destructive ? 'danger' : 'secondary'} onClick={() => setOpen(true)}>
        {destructive ? 'Delete booking' : 'View details'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        title={destructive ? 'Delete this booking?' : 'Booking details'}
        description={destructive ? 'This cannot be undone.' : 'Toa Payoh Health Hub, 30 Oct 2026, 2:00 pm.'}
        initialFocusRef={destructive ? confirm : undefined}
      >
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button ref={confirm} variant={destructive ? 'danger' : 'primary'} onClick={() => setOpen(false)}>
            {destructive ? 'Delete' : 'OK'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export const DialogStory: StoryObj = { name: 'Dialog', render: () => <DialogDemo role="dialog" /> };
export const AlertDialog: StoryObj = { render: () => <DialogDemo role="alertdialog" /> };
