import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem } from './Accordion.js';

const meta = {
  title: 'Navigation/Accordion',
  component: Accordion,
  subcomponents: { AccordionItem },
  tags: ['autodocs'],
  args: {
    type: 'single',
    defaultValue: ['speed'],
    headingLevel: 3,
    children: (
      <>
        <AccordionItem value="speed" title="How long does a transfer take?">
          Instant transfers arrive in seconds, any time of day.
        </AccordionItem>
        <AccordionItem value="cancel" title="Can I cancel a scheduled transfer?">
          Yes, until 11:59 pm the day before it is due.
        </AccordionItem>
        <AccordionItem value="fees" title="Are there fees?" disabled>
          Local transfers are free.
        </AccordionItem>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Headers are real headings (set `headingLevel` to fit the page outline) containing buttons with `aria-expanded`. ↑/↓/Home/End move between headers.',
      },
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
export const Multiple: Story = { args: { type: 'multiple', defaultValue: ['speed', 'cancel'] } };
