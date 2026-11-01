import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// App unit and integration tests (jsdom). Whole journeys in a real browser live in e2e/ (Playwright).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
