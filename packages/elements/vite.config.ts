/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

// `vite build`: one self-contained ES module (React bundled) + one stylesheet, for any page.
// `vite build --mode demo`: the plain-HTML demo page, deployed beside the bank app at /elements/.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // React is bundled, so its dev/prod switch must be fixed at build time (tests keep Vitest's own).
  ...(mode !== 'test' && {
    define: { 'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production') },
  }),
  base: './',
  ...(mode === 'demo'
    ? { root: 'demo', build: { outDir: '../dist-demo', emptyOutDir: true, assetsInlineLimit: 0 } }
    : {
        build: {
          lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: () => 'kit-elements.js',
            cssFileName: 'kit-elements',
          },
          sourcemap: true,
        },
      }),
  test: {
    include: ['src/**/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
      }),
      instances: [{ browser: 'chromium' }],
    },
  },
}));
