import type { Meta, StoryObj } from '@storybook/react-vite';
import { Guilloche } from './Guilloche.js';

const meta = {
  title: 'Banking/Guilloche',
  component: Guilloche,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          width: 340,
          height: 214,
          overflow: 'hidden',
          borderRadius: 18,
          color: '#7fd8c1',
          background: 'var(--kit-brand-surface)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {Story()}
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The engraved security pattern from banknotes and cheques, drawn as deterministic SVG. Decorative: hidden from assistive technology. Use it on brand surfaces such as the balance card, card art and sign-in, never behind text that has to be read.',
      },
    },
  },
} satisfies Meta<typeof Guilloche>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rosette: Story = { args: { accentColor: '#c8a25a' } };
export const Waves: Story = { args: { variant: 'waves', accentColor: '#c8a25a' } };
export const DrawIn: Story = { args: { animate: true } };
