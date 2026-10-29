import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../docs/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  viteFinal: (vite) => ({
    ...vite,
    // vite.config.ts is set up for library mode; Storybook builds an app, so drop those options.
    build: { ...vite.build, lib: false, rolldownOptions: undefined },
  }),
  typescript: { reactDocgen: 'react-docgen' },
};

export default config;
