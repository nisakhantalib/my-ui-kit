import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select.js';

const meta = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    label: 'Time slot',
    hint: 'Morning slots fill up first',
    placeholder: 'Choose a time',
    defaultValue: '',
    required: true,
    children: (
      <>
        <option value="0900">9:00 am</option>
        <option value="1400">2:00 pm</option>
        <option value="1630">4:30 pm</option>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          'A styled native `<select>` (ADR 0004): phones open their own picker, typeahead and keyboard work, and every screen reader knows it. The `placeholder` option cannot be re-selected.',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = { args: { error: 'Choose a time slot' } };
