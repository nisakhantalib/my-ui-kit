import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton.js';

// Inline SVGs so the library's stories don't depend on an icon package.
const Bell = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const Eye = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const meta = {
  title: 'Actions/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: { label: 'Notifications, 2 unread', icon: Bell, badge: true },
  parameters: {
    docs: {
      description: {
        component:
          '`label` is required: it becomes the accessible name, because an icon alone says nothing to a screen reader. The badge is decorative, so put its meaning in the label. Use `aria-pressed` for toggles.',
      },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBadge: Story = {};
export const Toggle: Story = { args: { label: 'Hide balances', icon: Eye, badge: false, 'aria-pressed': true } };
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <IconButton {...args} variant="ghost" />
      <IconButton {...args} variant="secondary" />
      <IconButton {...args} variant="primary" badge={false} />
      <IconButton {...args} size="sm" badge={false} />
    </div>
  ),
};
