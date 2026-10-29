import type { Preview } from '@storybook/react-vite';
import { AnnouncerProvider, ToastProvider } from '../src/index.js';
import '../src/styles.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colour theme (sets <html data-theme>, same switch apps use)',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, { globals }) => {
      document.documentElement.dataset.theme = globals.theme;
      return (
        <AnnouncerProvider>
          <ToastProvider>
            <div style={{ fontFamily: 'var(--kit-font)', color: 'var(--kit-text)' }}>
              <Story />
            </div>
          </ToastProvider>
        </AnnouncerProvider>
      );
    },
  ],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true }, // the theme toolbar drives the background through tokens
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    // Same WCAG 2.2 A/AA rule set the tests use; the Accessibility panel shows results per story.
    a11y: {
      options: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } },
    },
    options: {
      storySort: { order: ['Introduction', 'Foundations', 'Actions', 'Forms', 'Navigation', 'Feedback', 'Overlays'] },
    },
  },
};

export default preview;
