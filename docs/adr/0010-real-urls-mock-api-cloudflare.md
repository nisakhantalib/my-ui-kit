# 0010: Real URLs, a mocked banking API, and Cloudflare Workers hosting

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

Orchid Bank started as a single-page prototype: hash URLs (`#/pay`), data generated in memory, a fake loading delay, a demo sign-in screen as the front door, and GitHub Pages hosting (which can't send headers, so the Content-Security-Policy only existed in `vite preview`). It demonstrated the components, but it did not behave like a production banking front end: no public site, no network layer, no real loading or error states, no shareable deep links.

## Decision

- **A public site and an app.** `/` is the marketing site (hero, products, rates, security, FAQ, footer), `/login` the demo sign-in, `/app/*` the banking app. **React Router** (data router) with real History-API URLs. Plain `<a href>` links stay plain: a root listener turns same-origin clicks into client-side navigations, so pages and the kit don't need a router-specific link component. Old `#/…` links are forwarded.
- **A typed API client plus TanStack Query.** The app calls `GET /api/:market/overview`, `POST /api/:market/transfers` and `PUT /api/:market/card` with `fetch`. Queries cache and retry; card controls update optimistically and roll back on failure; a transfer applies its receipt locally, then refetches. Errors are RFC 9457 problem details, and a failed overview shows a retry screen instead of a broken page.
- **Mock Service Worker as the backend.** The handlers own the state, latency and validation (insufficient funds, daily limit, blocked card) a real gateway would. The worker starts on the first API call, so the public site never downloads it. Swapping in a real API means deleting `src/api/mock.ts` and the `startMockServer` call; nothing else changes.
- **Cloudflare Workers static assets.** `npm run build:site` assembles the bank at `/` and Storybook at `/storybook/`; `wrangler deploy` serves it, with `not_found_handling: single-page-application` for deep links and `public/_headers` for the same CSP the e2e suite runs under (now enforced in production too), HSTS, and long-lived caching of hashed assets.
- **Libraries where they earn their place:** Motion (hero parallax, scroll reveals; `MotionConfig reducedMotion="user"`), Recharts (cash flow, savings growth; lazy-loaded, labelled as images with the figures in text), Embla (swipeable account cards on phones). The kit still provides every control, form, dialog and table.

## Consequences

- The offline Workbox service worker is gone: one origin can have one root service worker, and it is now MSW's. The app stays installable (web manifest), and the Android app is unchanged. With a real backend, the offline worker can return.
- The first chunk grew (router and query client) but Lighthouse budgets still pass on every page; charts, Motion and MSW load only where they are used.
- The e2e suite now covers deep links, back/forward, the 404 page, legacy hash links, the public site and a transfer that round-trips through the API.
