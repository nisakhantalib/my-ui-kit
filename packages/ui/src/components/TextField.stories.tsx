import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField.js';

const meta = {
  title: 'Forms/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: { label: 'Email', hint: 'We send the receipt here', required: true },
  parameters: {
    docs: {
      description: {
        component:
          'Label, hint and error are wired with `htmlFor` and `aria-describedby`; an error sets `aria-invalid` and is announced through a live region. Every form control in the kit shares this wiring (`useFieldIds`, `FieldHint`, `FieldError`).',
      },
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = {
  args: { error: 'Enter an email address like name@example.com', defaultValue: 'weiling@' },
};
export const ReadOnly: Story = {
  args: { label: 'Reference number', defaultValue: 'BK-20261029', readOnly: true, hint: undefined },
};
