# My UI Kit

Accessible, composable React components (WCAG 2.2 AA), published as an npm package,
plus **ClinicBook SG** — an installable, offline-capable PWA built with them.

## Screenshots

| Booking flow, desktop (light) | Phone (dark) |
|---|---|
| ![Booking form on desktop in light mode](docs/screenshots/booking-desktop-light.png) | ![Booking form on a phone in dark mode](docs/screenshots/booking-phone-dark.png) |

| Component gallery (light) | Component gallery (dark) |
|---|---|
| ![Every component and state in light mode](docs/screenshots/gallery-light.png) | ![The same components re-themed in dark mode](docs/screenshots/gallery-dark.png) |

The demo app has two pages: **Book** (`#/`), a 3-step booking flow, and **Components** (`#/components`), a living style guide with every variant and state, a dark-mode toggle, and a design-token table that measures contrast from the live CSS.

| Job requirement | Where it is in this repo |
|---|---|
| Reusable, composable React components | `packages/ui/src/components`: `Tabs` is a compound component (`Tabs/TabList/Tab/TabPanel`), works controlled or uncontrolled; `Button`/`TextField` forward refs |
| JavaScript / TypeScript | Strict TypeScript; `.d.ts` emitted with `tsc` and checked with Are the Types Wrong |
| UI testing | 3 layers: Vitest + Testing Library in jsdom (21), **Vitest Browser Mode in real Chromium** (5), Playwright end-to-end on desktop + phone (12). axe-core WCAG 2.2 A/AA checks at every layer |
| npm package publishing | ESM-only `exports` map, `peerDependencies`, `engines`; publint + Are the Types Wrong in CI; **Changesets** for versions and CHANGELOG; **npm trusted publishing (OIDC)** with automatic provenance, no long-lived token |
| PWA / hybrid | `apps/demo`: `vite-plugin-pwa` manifest + Workbox service worker; Playwright test proves it reloads offline |
| Screen reader / assistive tech | WAI-ARIA APG patterns, live regions, focus management, `inert` background behind dialogs, skip link. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the WCAG 2.2 criteria mapping and Singapore DSS / Oobee notes |
| Requirements → specs | ACCESSIBILITY.md maps each component to WCAG success criteria; changesets record each change |
| Build tools | Vite 8 (Rolldown) library mode + app, tsc |
| CSS libraries | Tailwind CSS 4 in the app, mapped onto the library's CSS-variable design tokens |
| Analytics (Adobe Analytics / Omniture) | `packages/ui/src/analytics`: adapters for **AEP Web SDK (alloy.js)**, legacy **AppMeasurement** (`s.t()` / `s.tl()`) and the Adobe Client Data Layer. Same `variableMap` config for both, so migration is a one-line swap. Consent-gated |
| CI/CD | GitHub Actions: typecheck → tests (jsdom + Chromium) → build → package checks → e2e → GitHub Pages; Changesets release workflow |

## Quick start

```bash
npm install
npx playwright install chromium   # once, for the real-browser and e2e tests
npm test                # 26 component tests: 21 jsdom + 5 in real Chromium
npm run test:e2e        # 12 Playwright tests (desktop + Pixel 7)
npm run dev             # builds the library, then starts the PWA at http://localhost:5173
npm run build           # library -> packages/ui/dist, app -> apps/demo/dist
npm run check:package   # publint + Are the Types Wrong
```

## Using the package

```bash
npm install @nisakhantalib/my-ui-kit
```

```tsx
import { Button, TextField, Tabs, TabList, Tab, TabPanel, AnalyticsProvider, adobeAnalyticsAdapter } from '@nisakhantalib/my-ui-kit';
import '@nisakhantalib/my-ui-kit/styles.css';

const adobe = adobeAnalyticsAdapter({
  variableMap: { component: 'eVar5', id: 'prop3' },
  eventMap: { form_submit: 'event12' },
});

<AnalyticsProvider adapters={[adobe]} enabled={userConsented}>
  <TextField label="Email" hint="We send the receipt here" error={emailError} required />
  <Button trackId="submit-claim">Submit</Button>
</AnalyticsProvider>;
```

Clicking the button above sets `s.eVar5 = 'Button'`, `s.prop3 = 'submit-claim'`,
`s.linkTrackVars = 'eVar5,prop3'` and calls `s.tl(true, 'o', 'button_click')`.

On the Adobe Experience Platform Web SDK, swap the adapter and keep the same config:

```tsx
const adobe = adobeWebSdkAdapter({ variableMap: { component: 'eVar5', id: 'prop3' } });
// same click -> alloy('sendEvent', { data: { __adobe: { analytics: {
//   eVar5: 'Button', prop3: 'submit-claim', linkName: 'button_click', linkType: 'o' } } } })
```

## Components

| Component | Accessibility behaviour |
|---|---|
| `Button` | `aria-busy` while loading; uses `aria-disabled` so it stays in the tab order |
| `TextField` | label via `htmlFor`, hint + error joined in `aria-describedby`, `aria-invalid`, error in a live region |
| `Tabs` | roving tabindex, ←/→/Home/End, automatic or manual activation, controlled or uncontrolled |
| `Dialog` | focus moves in, Tab is trapped, Escape closes, focus returns to the trigger, scroll locked, `alertdialog` variant |
| `AnnouncerProvider` / `useAnnounce` | polite + assertive live regions for status messages (WCAG 4.1.3) |
| `SkipLink`, `VisuallyHidden` | WCAG 2.4.1 bypass block; screen-reader-only text |

## Accessibility

See [ACCESSIBILITY.md](ACCESSIBILITY.md): WCAG 2.2 AA target, success criteria per component, how each layer is tested, and the manual NVDA / VoiceOver checklist.

## Release

1. In your PR, run `npm run changeset`, pick patch / minor / major, and describe the change.
2. When merged to `main`, `release.yml` opens a **Version Packages** PR that bumps the version and writes `CHANGELOG.md`.
3. Merging that PR publishes to npm using **trusted publishing (OIDC)**. There's no `NPM_TOKEN` secret, and provenance is attached automatically.

One-time setup on npmjs.com: package → Settings → Trusted publishing → GitHub Actions → repo `nisakhantalib/my-ui-kit`, workflow `release.yml`.
