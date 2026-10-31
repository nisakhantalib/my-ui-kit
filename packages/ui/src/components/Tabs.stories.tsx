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
        <TabList label="Statements">
          <Tab value="details">Transactions</Tab>
          <Tab value="statements">Statements</Tab>
          <Tab value="review">Tax documents</Tab>
          <Tab value="paid" disabled>
            Archived
          </Tab>
        </TabList>
        <TabPanel value="details">Everything in the last 90 days.</TabPanel>
        <TabPanel value="statements">Monthly PDF statements.</TabPanel>
        <TabPanel value="review">Interest and tax certificates.</TabPanel>
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
