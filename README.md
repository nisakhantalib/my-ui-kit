# My UI Kit

**An accessible, multi-brand, multi-market React component library, governed like a product.** It ships 22 components (including the hard banking ones), design tokens that refuse to build if contrast fails, Web Components for non-React teams, and lint, codemod and adoption tooling. Two reference apps use it: a fictional bank in five markets, and a public-service PWA with an Android app.

[![CI](https://github.com/nisakhantalib/my-ui-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/nisakhantalib/my-ui-kit/actions/workflows/ci.yml)

**Live:** [Orchid Bank](https://nisakhantalib.github.io/my-ui-kit/) · [Storybook](https://nisakhantalib.github.io/my-ui-kit/storybook/) · [ClinicBook SG](https://nisakhantalib.github.io/my-ui-kit/clinic/) · [Web Components demo](https://nisakhantalib.github.io/my-ui-kit/elements/) · **Start here:** [one-page case study](docs/case-study.md)

| Orchid Bank: overview, Singapore (light) | Hong Kong · 繁體中文 (dark) |
|---|---|
| ![Bank dashboard: balance card, accounts with masked numbers, spending chart, transactions table](docs/screenshots/bank-overview-light.png) | ![The same dashboard in Traditional Chinese, dark mode, HKD](docs/screenshots/bank-overview-dark-hk.png) |

| Payee search (APG combobox) | OTP approval (one real input) | Receipt, Indonesia, phone (dark) |
|---|---|---|
| ![Combobox listing payees with initials and masked account details](docs/screenshots/bank-pay-combobox.png) | ![Approve this transfer dialog with a six-box one-time password field](docs/screenshots/bank-pay-otp.png) | ![Transfer sent receipt in Bahasa Indonesia with rupiah amount](docs/screenshots/bank-receipt-phone-dark-id.png) |

<details>
<summary>The same library, second brand: ClinicBook SG (public service, PWA + Android)</summary>

| Booking flow | Component gallery (dark) |
|---|---|
| ![Clinic booking step with radio cards and time slot errors](docs/screenshots/booking-desktop-light.png) | ![Every component re-themed in dark mode](docs/screenshots/gallery-dark.png) |

</details>

## What's in the repo

```
packages/
  ui              @nisakhantalib/my-ui-kit: 22 components, KitProvider (locale/currency/i18n), analytics adapters
    tokens/       palette → semantic → component tokens; brands/civic.json, brands/orchid.json; contrast.json
  elements        @nisakhantalib/my-ui-kit-elements: the same components as <kit-*> Web Components
  eslint-plugin   lint rules: no hard-coded colours, prefer kit components, no deprecated props (autofix)
  codemods        jscodeshift migrations, one for each deprecation
  scanner         kit-scan: adoption report across repos (usage, props, versions, deprecated usages, gaps)
apps/
  bank            Orchid Bank: 5 markets, strict CSP, Lighthouse budgets, visual regression
  demo            ClinicBook SG: offline PWA + Capacitor Android shell
docs/
  case-study.md   one page for reviewers
  specs/          brief → user stories → acceptance criteria → the test that proves each one
  adr/            9 architecture decision records
  governance.md   contribution model, RFCs, semver, deprecation policy, adoption metrics
  design/         principles, visual language, annotated wireframes
```

## How this covers the role

| Requirement | Evidence |
|---|---|
| **Reusable, composable components across platforms** | 22 components with compound APIs (`Tabs`, `RadioGroup`, `Accordion`) and one controlled/uncontrolled contract. Runs on **web, PWA, Android** (Capacitor) and **non-React stacks** (`<kit-*>` Web Components), in **2 brands × 5 markets** |
| **Business and design requirements → specs** | [Transfer spec](docs/specs/transfer-flow.md) and [booking spec](docs/specs/booking-flow.md): stakeholder brief, resolved questions, Given/When/Then criteria **each mapped to its e2e test**, tracking plans. [Component spec template](docs/specs/component-spec-template.md) + [RadioGroup spec](docs/specs/components/radio-group.md) |
| **Standards, best practices, architecture** | [9 ADRs](docs/adr/), [CONTRIBUTING](CONTRIBUTING.md) (API conventions, definition of done), [governance model](docs/governance.md), **enforced** by ESLint (jsx-a11y strict + our own plugin), Prettier, coverage floors, size budgets, a token contrast gate, a deprecated-API gate |
| **Communication with business, product, design** | Storybook with usage guidance, brand/market/theme toolbars, live contrast report and adoption dashboard; specs written for non-developers; [case study](docs/case-study.md) |
| **Web fundamentals, HTML, CSS** | Native elements first ([ADR 0004](docs/adr/0004-native-elements-first.md)); cascade layers, custom properties, `:has()`, `color-mix()`, safe-area insets, forced colours, reduced motion, 320px reflow |
| **JavaScript / TypeScript** | Strict TS (`noUncheckedIndexedAccess`), generic components (`Combobox<T>`, `DataTable<T>`), TS 7 for types; exact money arithmetic |
| **UI testing** | 80 jsdom + 8 real-Chromium component tests, **45 stories × 2 brands × 2 themes** axe audit, 6 Web Component browser tests, **34 Playwright runs** (two apps, desktop + Pixel 7), visual regression in a pinned container, Lighthouse CI, 49 tooling tests. The contrast, story-audit and token gates were each shown to fail on a deliberately broken build before being trusted |
| **React** | React 19, hooks, context, portals, compound components, `'use client'` output for Next.js Server Components |
| **npm package publishing** | Per-module ESM (`Button` alone **365 B**), `exports` map, publint + attw, size-limit, **Changesets**, **trusted publishing (OIDC) with provenance**, **CycloneDX SBOM** per release; 5 publishable packages |
| **Native / PWA / hybrid** | Workbox PWA (offline reload tested), Capacitor 8 Android APK built in CI, native share sheet with web fallbacks |
| **Accessible UI for screen readers** | APG patterns; live regions that exist before content; focus management on route and step changes; single-input OTP; spoken currency; masked values read as "ending 6789". [ACCESSIBILITY.md](ACCESSIBILITY.md) has the WCAG criterion per component and NVDA/VoiceOver scripts |
| **Visual design** | Two complete visual brands from one component set; dark mode designed (not inverted) with a dedicated `brand-surface` role; [design docs](docs/design/README.md) |
| *UI design, wireframes, mockups* | [Annotated wireframes](docs/design/README.md#wireframes), mapped decision by decision to the build |
| *Build tools* | Vite 8 (Rolldown) library/app/Web Components builds, tsc, Storybook, an in-repo token compiler |
| *CSS libraries* | Tailwind 4 in both apps, mapped onto kit tokens, with a layer order that keeps utilities able to override ([ADR 0003](docs/adr/0003-css-custom-properties-and-cascade-layers.md)) |
| *Adobe Analytics / Omniture* | Adapters for **AppMeasurement** (`s.t()` / `s.tl()`), **AEP Web SDK** (alloy) and the **Adobe Client Data Layer**, consent-gated; tracking plans in both specs |
| *CI/CD* | GitHub Actions: lint → format → tokens → types → tests → builds → package checks → size → Storybook audit → e2e → Lighthouse → visual → Android APK → Pages; Changesets release with SBOM; Dependabot |
| *Open source* | MIT, CONTRIBUTING, Code of Conduct, security policy, issue/PR templates, CODEOWNERS |

## Quick start

```bash
npm install
npx playwright install chromium   # once, for browser and e2e tests
npm run dev                       # Orchid Bank at http://localhost:5174 (npm run dev:clinic for ClinicBook)
npm run storybook                 # http://localhost:6006
npm run ci                        # lint, format, types, all unit/browser/tooling tests, builds, package and size checks
npm run test:e2e                  # Playwright, both apps, desktop + Pixel 7
```

## Using the package

```bash
npm install @nisakhantalib/my-ui-kit
```

```tsx
import { AmountInput, Button, Combobox, KitProvider, ToastProvider } from '@nisakhantalib/my-ui-kit';
import '@nisakhantalib/my-ui-kit/styles.css';

// Brand and dark mode are HTML attributes: <html lang="zh-HK" data-brand="orchid" data-theme="dark">
<KitProvider locale="zh-HK" currency="HKD">              {/* formats, parses and translates the kit's own words */}
  <ToastProvider>
    <Combobox label="收款人" items={payees} getKey={(p) => p.id} getLabel={(p) => p.name} onValueChange={setPayee} />
    <AmountInput label="金額" value={cents} onValueChange={setCents} />   {/* integer minor units */}
    <Button trackId="transfer-continue">繼續</Button>                       {/* sends an analytics event */}
  </ToastProvider>
</KitProvider>
```

- **Brands:** `data-brand="civic" | "orchid"` on `<html>` or any element; `data-theme="dark"` or the OS setting for dark mode.
- **Tailwind:** declare `@layer theme, base, kit, components, utilities;` before importing both stylesheets.
- **Tokens in JS:** `import { tokens, brandTokens, contrastReport } from '@nisakhantalib/my-ui-kit'`; raw JSON at `@nisakhantalib/my-ui-kit/tokens/*`.
- **Analytics:** wrap in `<AnalyticsProvider adapters={[adobeWebSdkAdapter({ variableMap })]} enabled={consent}>`.
- **Not on React?** Use [`@nisakhantalib/my-ui-kit-elements`](packages/elements/README.md).

## Components

| Group | Components |
|---|---|
| Actions | `Button` |
| Forms | `TextField`, `Select`, `Checkbox` (incl. mixed state), `RadioGroup` + `Radio` (plain / cards), `Switch` |
| Banking | `AmountInput`, `OTPInput`, `Combobox`, `DataTable`, `MaskedValue`, `Badge` |
| Navigation | `Tabs` (`TabList`, `Tab`, `TabPanel`), `Accordion` + `AccordionItem`, `SkipLink` |
| Feedback | `Alert`, `ErrorSummary`, `ToastProvider` + `useToast`, `Skeleton`, `AnnouncerProvider` + `useAnnounce` |
| Overlays | `Dialog` (`dialog` / `alertdialog`) |
| Foundations | `KitProvider` + `useKit`, `AnalyticsProvider` + `useTrack` / `usePageView`, `VisuallyHidden`, `useControllableState`, `tokens` |

## Release

1. In your PR, run `npm run changeset` and describe the change (patch / minor / major; see the [deprecation policy](docs/governance.md#deprecation-policy)).
2. On merge to `main`, `release.yml` opens a **Version Packages** PR that bumps versions and writes the CHANGELOGs.
3. Merging that PR publishes to npm with **trusted publishing (OIDC)**: no `NPM_TOKEN`, provenance attached, SBOM uploaded to the GitHub release.

One-time setup: publish each package once by hand (`npm publish` in its folder). Then, on npmjs.com, go to package → Settings → Trusted publishing → GitHub Actions and enter repo `nisakhantalib/my-ui-kit` and workflow `release.yml`.

## License

[MIT](LICENSE). Orchid Bank is a fictional bank; any resemblance to a real institution is unintended.
