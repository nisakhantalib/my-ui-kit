import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Bank-grade Content Security Policy: no inline scripts or styles, no third-party origins.
 * Served by `vite preview`, so the e2e suite proves the app (and the kit) run under it. In
 * production the same policy comes from public/_headers (Cloudflare Workers static assets).
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    // Never inline assets as data: URIs; fonts and images stay same-origin files the CSP allows.
    assetsInlineLimit: 0,
  },
  preview: {
    headers: {
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});
