import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox.js';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { label: 'Send me a reminder', hint: 'One SMS the day before' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = {
  args: { label: 'I agree to the terms', hint: undefined, error: 'You must agree to continue', required: true },
};

function ParentCheckbox() {
  const [r, setR] = useState({ sms: true, email: false });
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Checkbox
        label="All reminders"
        checked={r.sms && r.email}
        indeterminate={r.sms !== r.email}
        onChange={(e) => setR({ sms: e.target.checked, email: e.target.checked })}
      />
      <div style={{ display: 'grid', gap: 12, paddingLeft: 36 }}>
        <Checkbox label="SMS" checked={r.sms} onChange={(e) => setR((x) => ({ ...x, sms: e.target.checked }))} />
        <Checkbox label="Email" checked={r.email} onChange={(e) => setR((x) => ({ ...x, email: e.target.checked }))} />
      </div>
    </div>
  );
}

/** A parent checkbox shows "mixed" when only some children are checked; screen readers say "half checked". */
export const MixedState: Story = { render: () => <ParentCheckbox /> };
