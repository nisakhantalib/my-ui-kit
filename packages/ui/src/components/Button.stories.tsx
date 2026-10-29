import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.js';

const meta = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Book appointment', variant: 'primary', size: 'md', loading: false, disabled: false },
  parameters: {
    docs: {
      description: {
        component:
          'Use `primary` for the one main action on a screen, `secondary` for alternatives, `danger` for destructive actions (pair it with an alert dialog), and `ghost` for low-emphasis actions in toolbars.\n\n' +
          'Disabled and loading buttons use `aria-disabled`, not `disabled`, so they stay in the Tab order and screen-reader users can still find them and hear why.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="danger">
        Delete booking
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const Loading: Story = { args: { loading: true, children: 'Saving…' } };

export const Disabled: Story = { args: { disabled: true } };

/** `trackId` sends a `button_click` event through the AnalyticsProvider (Adobe Analytics, data layer…). */
export const Tracked: Story = { args: { trackId: 'book-now', children: 'Book now' } };
