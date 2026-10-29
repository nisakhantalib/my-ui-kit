import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorSummary } from './Alert.js';
import { TextField } from './TextField.js';

const meta = {
  title: 'Feedback/ErrorSummary',
  component: ErrorSummary,
  tags: ['autodocs'],
  args: {
    focusOnShow: false,
    errors: [
      { id: 'es-name', message: 'Enter your full name' },
      { id: 'es-nric', message: 'Enter a valid NRIC or FIN, for example S1234567D' },
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          'After a failed submit: takes focus (`focusOnShow`, default true), states the count, and each link moves focus to its field and scrolls the label into view. The GOV.UK / SGDS pattern.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
      <ErrorSummary {...args} />
      <TextField id="es-name" label="Full name" error="Enter your full name" />
      <TextField id="es-nric" label="NRIC / FIN" error="Enter a valid NRIC or FIN, for example S1234567D" />
    </div>
  ),
} satisfies Meta<typeof ErrorSummary>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
