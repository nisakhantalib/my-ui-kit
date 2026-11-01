import { addons } from 'storybook/manager-api';
import { theme } from './theme';

// Storybook's own chrome in the design system's identity (see theme.ts).
addons.setConfig({
  theme,
  sidebar: { showRoots: true },
});
