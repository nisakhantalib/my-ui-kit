import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge.js';

const meta = {
  title: 'Banking/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { tone: 'warning', children: 'Pending' },
  parameters: {
    docs: {
      description: {
        component:
          'Status text with a tone dot. The text stays in the body colour, so contrast never depends on the tone, and the meaning is in words.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Badge>Draft</Badge>
      <Badge tone="info">Scheduled</Badge>
      <Badge tone="success">Received</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Failed</Badge>
    </div>
  ),
};
