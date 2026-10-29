import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch.js';

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { label: 'Appointment reminders', description: 'Applies straight away', defaultChecked: true },
  parameters: {
    docs: {
      description: {
        component:
          'For settings that apply immediately (APG Switch: `role="switch"`, `aria-checked`). If the choice only takes effect on submit, use a Checkbox.',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = { args: { label: 'Share data with my GP', description: undefined, defaultChecked: false } };
export const Disabled: Story = { args: { label: 'Locked setting', description: undefined, disabled: true } };
