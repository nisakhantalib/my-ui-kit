import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem } from './Accordion.js';

const meta = {
  title: 'Navigation/Accordion',
  component: Accordion,
  subcomponents: { AccordionItem },
  tags: ['autodocs'],
  args: {
    type: 'single',
    defaultValue: ['bring'],
    headingLevel: 3,
    children: (
      <>
        <AccordionItem value="bring" title="What should I bring?">
          Your NRIC or FIN card, and any referral letter.
        </AccordionItem>
        <AccordionItem value="cancel" title="Can I change or cancel?">
          Yes, up to 24 hours before your appointment.
        </AccordionItem>
        <AccordionItem value="pay" title="How do I pay?" disabled>
          At the clinic counter.
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
export const Multiple: Story = { args: { type: 'multiple', defaultValue: ['bring', 'cancel'] } };
