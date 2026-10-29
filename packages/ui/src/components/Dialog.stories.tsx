import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.js';
import { Dialog } from './Dialog.js';

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

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  args: { open: false, title: 'Booking details', onClose: () => {} },
  parameters: {
    docs: {
      description: {
        component:
          'Focus moves in and returns to the trigger; Tab is trapped; Escape closes; the page behind is `inert`, so screen readers cannot wander out. `role="alertdialog"` for confirmations that interrupt.',
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
export const Default: StoryObj<typeof meta> = { render: () => <DialogDemo role="dialog" /> };
export const AlertDialog: StoryObj<typeof meta> = { render: () => <DialogDemo role="alertdialog" /> };
