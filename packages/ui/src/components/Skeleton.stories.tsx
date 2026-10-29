import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Badge.js';

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  args: { lines: 3 },
  parameters: {
    docs: {
      description: {
        component:
          'Hidden from assistive technology. Mark the loading region `aria-busy="true"` and announce when it is ready. The shimmer stops under `prefers-reduced-motion`.',
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
export const CardPlaceholder: Story = {
  render: () => (
    <div
      aria-busy="true"
      aria-label="Loading accounts"
      role="group"
      style={{ display: 'grid', gap: 12, maxWidth: 420 }}
    >
      <Skeleton shape="block" />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton shape="circle" />
        <div style={{ flex: 1 }}>
          <Skeleton lines={2} />
        </div>
      </div>
    </div>
  ),
};
