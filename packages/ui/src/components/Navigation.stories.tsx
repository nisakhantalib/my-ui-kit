import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem } from './Accordion.js';
import { Tab, TabList, TabPanel, Tabs } from './Tabs.js';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: { defaultValue: 'details', activation: 'automatic', children: null },
  parameters: {
    docs: {
      description: {
        component:
          'Compound component: `Tabs` › `TabList` › `Tab`, plus one `TabPanel` per tab. ←/→ move, Home/End jump. ' +
          '`activation="manual"` waits for Enter/Space; use it when switching a panel is slow or has side effects.',
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabList label="Booking steps">
        <Tab value="details">1. Your details</Tab>
        <Tab value="clinic">2. Clinic &amp; date</Tab>
        <Tab value="review">3. Review</Tab>
        <Tab value="paid" disabled>
          4. Payment
        </Tab>
      </TabList>
      <TabPanel value="details">Name, NRIC and email.</TabPanel>
      <TabPanel value="clinic">Which clinic and when.</TabPanel>
      <TabPanel value="review">Check everything before confirming.</TabPanel>
      <TabPanel value="paid">Not available.</TabPanel>
    </Tabs>
  ),
};

export const ManualActivation: Story = { ...Default, args: { activation: 'manual' } };

export const AccordionFaq: StoryObj<typeof Accordion> = {
  name: 'Accordion',
  render: () => (
    <Accordion type="single" defaultValue={['bring']} headingLevel={3}>
      <AccordionItem value="bring" title="What should I bring?">
        Your NRIC or FIN card, and any referral letter.
      </AccordionItem>
      <AccordionItem value="cancel" title="Can I change or cancel?">
        Yes, up to 24 hours before your appointment.
      </AccordionItem>
      <AccordionItem value="pay" title="How do I pay?" disabled>
        At the clinic counter.
      </AccordionItem>
    </Accordion>
  ),
};
