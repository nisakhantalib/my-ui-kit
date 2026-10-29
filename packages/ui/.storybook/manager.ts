import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Storybook's own chrome in the kit's colours, so the docs site looks like part of the product.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'My UI Kit',
    brandUrl: 'https://github.com/nisakhantalib/my-ui-kit',
    brandTarget: '_blank',
    colorPrimary: '#6a1fb0',
    colorSecondary: '#6a1fb0',
    appBg: '#f8f6fb',
    appContentBg: '#ffffff',
    appBorderColor: '#e4dfeb',
    appBorderRadius: 10,
    textColor: '#1a1523',
    textMutedColor: '#585067',
    barSelectedColor: '#6a1fb0',
    fontBase: '"Inter Variable", system-ui, sans-serif',
  }),
  sidebar: { showRoots: true },
});
