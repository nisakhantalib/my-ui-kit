import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from './test-setup.js';
import { AnalyticsProvider, Checkbox, Radio, RadioGroup, Select, Switch, type AnalyticsAdapter } from './index.js';

// ---------------- Select ----------------
describe('Select', () => {
  function Clinic({ error }: { error?: string }) {
    return (
      <Select
        label="Time slot"
        hint="Morning slots fill up first"
        placeholder="Choose a time"
        defaultValue=""
        error={error}
        required
      >
        <option value="0930">9:30 am</option>
        <option value="1400">2:00 pm</option>
      </Select>
    );
  }

  it('links label, hint and error, and marks the field invalid', () => {
    render(<Clinic error="Choose a time slot" />);
    const select = screen.getByRole('combobox', { name: /Time slot/ });
    expect(select).toBeRequired();
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Morning slots fill up first Choose a time slot');
  });

  it('shows the placeholder first but does not let users pick it again', async () => {
    render(<Clinic />);
    const select = screen.getByRole<HTMLSelectElement>('combobox');
    expect(select.value).toBe('');
    expect(screen.getByRole('option', { name: 'Choose a time' })).toBeDisabled();
    await userEvent.selectOptions(select, '1400');
    expect(select.value).toBe('1400');
  });

  it('has no axe violations in the error state', async () => {
    const { container } = render(<Clinic error="Choose a time slot" />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- Checkbox ----------------
describe('Checkbox', () => {
  it('toggles from its label and reads its hint', async () => {
    render(<Checkbox label="Send me a reminder" hint="One SMS the day before" />);
    const box = screen.getByRole('checkbox', { name: 'Send me a reminder' });
    expect(box).toHaveAccessibleDescription('One SMS the day before');
    await userEvent.click(screen.getByText('Send me a reminder'));
    expect(box).toBeChecked();
  });

  it('supports the indeterminate ("mixed") state and forwards its ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox ref={ref} label="All clinics" indeterminate />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', true);
  });

  it('marks an error as invalid and announces it', async () => {
    const { container } = render(<Checkbox label="I agree to the terms" error="You must agree to continue" required />);
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('You must agree to continue');
    await expectNoA11yViolations(container);
  });
});

// ---------------- RadioGroup ----------------
function Clinics({ error, onValueChange }: { error?: string; onValueChange?: (v: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <RadioGroup
      legend="Clinic"
      name="clinic"
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onValueChange?.(v);
      }}
      hint="Pick the one nearest you"
      error={error}
      variant="cards"
      required
    >
      <Radio value="tampines" label="Tampines Family Clinic" description="East" />
      <Radio value="jurong" label="Jurong West Medical Centre" description="West" />
      <Radio value="toapayoh" label="Toa Payoh Health Hub" description="Central" disabled />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('is a named, described group whose radios share a name', () => {
    render(<Clinics error="Choose a clinic" />);
    const group = screen.getByRole('radiogroup', { name: 'Clinic' });
    expect(group).toHaveAccessibleDescription('Pick the one nearest you Choose a clinic');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    radios.forEach((r) => expect(r).toHaveAttribute('name', 'clinic'));
    expect(screen.getByRole('radio', { name: 'Jurong West Medical Centre' })).toHaveAccessibleDescription('West');
  });

  it('Tab enters once, arrow keys move and select (native radio behaviour)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Clinics onValueChange={onValueChange} />);
    await user.click(screen.getByText('Tampines Family Clinic'));
    expect(screen.getByRole('radio', { name: 'Tampines Family Clinic' })).toBeChecked();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Jurong West Medical Centre' })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith('jurong');
  });

  it('works uncontrolled with defaultValue', async () => {
    render(
      <RadioGroup legend="Language" name="lang" defaultValue="en">
        <Radio value="en" label="English" />
        <Radio value="zh" label="中文" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: '中文' }));
    expect(screen.getByRole('radio', { name: '中文' })).toBeChecked();
  });

  it('throws a helpful error when Radio is used on its own', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Radio value="x" label="x" />)).toThrow('<Radio> must be used inside <RadioGroup>.');
    vi.restoreAllMocks();
  });

  it('has no axe violations in the error state', async () => {
    const { container } = render(<Clinics error="Choose a clinic" />);
    await expectNoA11yViolations(container);
  });
});

// ---------------- Switch ----------------
describe('Switch', () => {
  it('is a named switch that toggles aria-checked and tracks the change', async () => {
    const adapter: AnalyticsAdapter = { track: vi.fn() };
    const onCheckedChange = vi.fn();
    render(
      <AnalyticsProvider adapters={[adapter]}>
        <Switch
          label="Email reminders"
          description="Sent the day before"
          trackId="reminders"
          onCheckedChange={onCheckedChange}
        />
      </AnalyticsProvider>,
    );
    const sw = screen.getByRole('switch', { name: 'Email reminders' });
    expect(sw).toHaveAccessibleDescription('Sent the day before');
    expect(sw).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(adapter.track).toHaveBeenCalledWith({
      name: 'switch_toggle',
      properties: { component: 'Switch', id: 'reminders', checked: true },
    });
  });

  it('toggles with Space and from its visible label', async () => {
    const user = userEvent.setup();
    render(<Switch label="Dark mode" />);
    const sw = screen.getByRole('switch');
    await user.tab();
    await user.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByText('Dark mode'));
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('respects the controlled value', async () => {
    render(<Switch label="Locked" checked={false} onCheckedChange={() => {}} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Switch label="Email reminders" description="Sent the day before" defaultChecked />);
    await expectNoA11yViolations(container);
  });
});
