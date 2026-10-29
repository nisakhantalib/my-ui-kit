import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab, TabList, TabPanel, Tabs } from './Tabs.js';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabPanel },
  tags: ['autodocs'],
  args: {
    defaultValue: 'details',
    activation: 'automatic',
    children: (
      <>
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
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Compound component. ←/→ move, Home/End jump, disabled tabs are skipped. `activation="manual"` waits for Enter/Space; use it when switching a panel is slow or has side effects.',
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Automatic: Story = {};
export const Manual: Story = { args: { activation: 'manual' } };
