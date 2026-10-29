import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox.js';
import { Radio, RadioGroup } from './RadioGroup.js';
import { Select } from './Select.js';
import { Switch } from './Switch.js';
import { TextField } from './TextField.js';

/** Every form control shares the same label / hint / error wiring, so they look and read the same. */
const meta = {
  title: 'Forms/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: { label: 'Email', hint: 'We send the receipt here', required: true, error: '' },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: 'Enter an email address like name@example.com', defaultValue: 'weiling@' },
};

export const ReadOnly: Story = {
  args: { label: 'Reference number', defaultValue: 'BK-20261029', readOnly: true, hint: '' },
};

export const SelectField: StoryObj<typeof Select> = {
  name: 'Select',
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <Select label="Time slot" hint="Morning slots fill up first" placeholder="Choose a time" defaultValue="" required>
        <option value="0900">9:00 am</option>
        <option value="1400">2:00 pm</option>
      </Select>
      <Select label="Language" error="Choose a language" placeholder="Choose" defaultValue="">
        <option value="en">English</option>
        <option value="zh">中文</option>
        <option value="ms">Bahasa Melayu</option>
        <option value="ta">தமிழ்</option>
      </Select>
    </div>
  ),
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
        <Checkbox
          label="SMS"
          hint="The day before"
          checked={r.sms}
          onChange={(e) => setR((x) => ({ ...x, sms: e.target.checked }))}
        />
        <Checkbox label="Email" checked={r.email} onChange={(e) => setR((x) => ({ ...x, email: e.target.checked }))} />
      </div>
      <Checkbox label="I agree to the terms" error="You must agree to continue" required />
    </div>
  );
}

export const CheckboxField: StoryObj<typeof Checkbox> = {
  name: 'Checkbox (with mixed state)',
  render: () => <ParentCheckbox />,
};

export const RadioCards: StoryObj<typeof RadioGroup> = {
  name: 'RadioGroup',
  render: () => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 420 }}>
      <RadioGroup legend="Clinic" name="clinic" variant="cards" defaultValue="tampines" hint="Pick the one nearest you">
        <Radio value="tampines" label="Tampines Family Clinic" description="East region" />
        <Radio value="jurong" label="Jurong West Medical Centre" description="West region" />
        <Radio value="toapayoh" label="Toa Payoh Health Hub" description="Fully booked" disabled />
      </RadioGroup>
      <RadioGroup legend="Contact me by" name="contact" error="Choose how we contact you" required>
        <Radio value="sms" label="SMS" />
        <Radio value="call" label="Phone call" />
      </RadioGroup>
    </div>
  ),
};

export const SwitchField: StoryObj<typeof Switch> = {
  name: 'Switch',
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Switch label="Appointment reminders" description="Applies straight away" defaultChecked />
      <Switch label="Share data with my GP" />
      <Switch label="Locked setting" disabled />
    </div>
  ),
};
