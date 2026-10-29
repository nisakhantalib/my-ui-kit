/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

// Library mode: ESM only (Node 20.19+ and every modern bundler load ESM, even from require()).
// React stays external so consumers bring their own copy.
// Vite 8 bundles with Rolldown, so options live under `rolldownOptions` (rollupOptions is deprecated).
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      cssFileName: 'my-ui-kit',
    },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // One file per source module, so an app that imports only Button ships only Button.
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // React Server Components (Next.js App Router): hooks-based modules must be client modules.
        // tokens.js and utils.js stay server-safe.
        banner: (chunk) => (/^(components|analytics)\//.test(chunk.fileName) ? "'use client';" : ''),
      },
    },
    sourcemap: true,
  },
  test: {
    coverage: { reporter: ['text', 'lcov'] },
    projects: [
      {
        // Fast logic + ARIA tests in jsdom.
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.tsx'],
          setupFiles: ['./src/test-setup.ts'],
        },
      },
      {
        // Real Chromium: real focus, real keyboard, real CSS, so axe can check colour contrast.
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              // CI installs Chromium with `npx playwright install chromium`; locally you can point to any Chrome.
              launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
