import type { Preview } from '@storybook/react-vite';
import { AnnouncerProvider, KitProvider, ToastProvider } from '../src/index.js';
import '@fontsource-variable/inter';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '../src/styles.css';

/** The markets the reference bank runs in: one brand, five locales and currencies. */
const MARKETS = {
  SG: { locale: 'en-SG', currency: 'SGD' },
  HK: { locale: 'zh-HK', currency: 'HKD' },
  TW: { locale: 'zh-TW', currency: 'TWD' },
  ID: { locale: 'id-ID', currency: 'IDR' },
  IN: { locale: 'en-IN', currency: 'INR' },
} as const;

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colour mode (sets <html data-theme>, the same switch apps use)',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
    brand: {
      description: 'Brand (sets <html data-brand>): one component library, many products',
      toolbar: { title: 'Brand', icon: 'paintbrush', items: ['civic', 'orchid', 'private'], dynamicTitle: true },
    },
    market: {
      description: 'Market: locale, currency and the library’s built-in words',
      toolbar: { title: 'Market', icon: 'globe', items: Object.keys(MARKETS), dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light', brand: 'civic', market: 'SG' },
  decorators: [
    (Story, { globals }) => {
      const root = document.documentElement;
      root.dataset.theme = globals.theme;
      root.dataset.brand = globals.brand;
      const market = MARKETS[globals.market as keyof typeof MARKETS] ?? MARKETS.SG;
      root.lang = market.locale;
      return (
        <KitProvider locale={market.locale} currency={market.currency}>
          <AnnouncerProvider>
            <ToastProvider>
              <div style={{ fontFamily: 'var(--kit-font)', color: 'var(--kit-text)' }}>
                <Story />
              </div>
            </ToastProvider>
          </AnnouncerProvider>
        </KitProvider>
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
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          'Actions',
          'Forms',
          'Banking',
          'Navigation',
          'Feedback',
          'Overlays',
          'Governance',
        ],
      },
    },
  },
};

export default preview;
