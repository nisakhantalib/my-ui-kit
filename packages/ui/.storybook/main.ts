import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../docs/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  // Brand mark and the kit's fonts for Storybook's own chrome (manager-head.html).
  staticDirs: ['./static'],
  addons: [
    // GitHub-flavoured Markdown, so tables in .mdx pages render.
    {
      name: '@storybook/addon-docs',
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-a11y',
  ],
  viteFinal: (vite) => ({
    ...vite,
    // vite.config.ts is set up for library mode; Storybook builds an app, so drop those options.
    build: { ...vite.build, lib: false, rolldownOptions: undefined },
  }),
  typescript: { reactDocgen: 'react-docgen' },
  // A published component library, not a sandbox: no release-notes pop-ups.
  core: { disableWhatsNewNotifications: true },
};

export default config;
