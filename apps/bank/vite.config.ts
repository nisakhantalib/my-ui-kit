import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Bank-grade Content Security Policy: no inline scripts or styles, no third-party origins.
 * Served by `vite preview`, so the e2e suite proves the app (and the kit) run under it.
 * Static hosting (GitHub Pages) can't set headers; in production this comes from the CDN or gateway.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    // Installable and offline-capable. The registration script is a same-origin file, so it stays inside the CSP.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Orchid Bank',
        short_name: 'Orchid',
        description: 'Orchid Bank, a fictional bank built with My UI Kit',
        theme_color: '#6a1fb0',
        background_color: '#f8f6fb',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Storybook is deployed beside the app under /storybook/; don't answer its URLs with the app shell.
        navigateFallbackDenylist: [/\/storybook\//],
      },
    }),
  ],
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
