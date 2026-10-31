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
        {destructive ? 'Cancel transfer' : 'View details'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        title={destructive ? 'Cancel this scheduled transfer?' : 'Transfer details'}
        description={
          destructive
            ? 'The money stays in your account. This cannot be undone.'
            : 'SGD 250.00 to Tan Wei Ling, scheduled for 1 Nov 2026.'
        }
        initialFocusRef={destructive ? confirm : undefined}
      >
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button ref={confirm} variant={destructive ? 'danger' : 'primary'} onClick={() => setOpen(false)}>
            {destructive ? 'Cancel transfer' : 'OK'}
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
  args: { open: false, title: 'Transfer details', onClose: () => {} },
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

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>View transaction</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Transaction details" placement="sheet" showClose>
        <dl style={{ display: 'grid', gap: 12, margin: 0 }}>
          <div>
            <dt>Merchant</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>NTUC FairPrice</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>-SGD 86.40</dd>
          </div>
        </dl>
      </Dialog>
    </>
  );
}

/** `placement="sheet"`: slides in from the right for details and side tasks; same focus rules as a dialog. */
export const Sheet: StoryObj<typeof meta> = { render: () => <SheetDemo /> };
