# Case study: a shared component library for a multi-market bank

**One page for reviewers.** What problem this solves, the decisions that matter, and the evidence, each with a link to the code.

## The problem

A regional bank has many product teams in several markets (here: Singapore, Hong Kong, Taiwan, Indonesia, India). Without a shared library each team rebuilds forms, amount fields, OTP entry and tables. The result is inconsistent UX, repeated accessibility bugs, money-handling bugs, and brand drift. A library only helps if teams **adopt** it and it **stays correct as it grows**, so the work is half components and half governance.

## What I built

| | |
|---|---|
| **The library** (`packages/ui`) | 22 accessible React components, including the hard banking ones: APG **Combobox** (payee search), **AmountInput** (integer minor units, locale parsing), **OTPInput** (one field, SMS autofill), sortable **DataTable**, **MaskedValue** |
| **Tokens and brands** (`packages/ui/tokens`) | Three-tier tokens (palette → semantic → component), two brands, light/dark. **The build fails if any of 80 WCAG contrast pairs drops below its minimum** |
| **Markets** (`KitProvider`) | Locale, currency and the library's own words in English, Traditional Chinese and Bahasa Indonesia |
| **Reference bank** (`apps/bank`) | Orchid Bank, a fictional bank: dashboard plus an instant transfer (payee → amount → review → OTP → receipt) in 5 markets, under a strict CSP |
| **Second brand** (`apps/demo`) | ClinicBook SG: the same library in a public-service brand, as an offline PWA and a Capacitor Android app |
| **Other frameworks** (`packages/elements`) | The same components as `<kit-*>` Web Components for Angular, Vue and plain-HTML teams |
| **Governance** (`packages/eslint-plugin`, `codemods`, `scanner`) | Lint rules, a codemod for each deprecation, and an adoption scanner whose report drives deprecation decisions |

## Decisions worth discussing

1. **Native elements first** ([ADR 0004](adr/0004-native-elements-first.md)). Radios, select and checkbox are native, so keyboard, mobile pickers and screen readers work for free. Custom widgets only where nothing native fits (Combobox, Tabs, Dialog).
2. **Money is never a float.** `AmountInput` emits integer minor units and parses with string arithmetic. Rupiah's zero decimals and Indian lakh grouping come from `Intl`, not hand-written rules.
3. **One real input for OTP.** Six boxes are six unlabelled fields to a screen reader and break paste and autofill. One `autocomplete="one-time-code"` input drawn as boxes fixes all three.
4. **Tokens are enforced, not documented.** Brands must implement the same token contract, and contrast is computed at build time. A brand that fails cannot ship ([ADR 0005](adr/0005-design-tokens-single-source.md)).
5. **Separate tokens for separate jobs.** Building the bank's dark-mode balance card exposed that "brand colour for text" and "brand colour for a large surface" need different values in dark mode, so `brand-surface` became its own token.
6. **CSS layers, not CSS-in-JS** ([ADR 0003](adr/0003-css-custom-properties-and-cascade-layers.md)). Zero runtime cost, works with React Server Components, works under `style-src 'self'`, and Tailwind utilities still override components.
7. **Governed like a product** ([governance.md](governance.md), [ADR 0009](adr/0009-governance-tooling.md)). Deprecate in a minor with a dev warning, a lint rule and a codemod. Remove in the next major only when the scanner shows zero usages.

## Evidence

| Claim | Proof |
|---|---|
| Accessible | 80 jsdom + 8 real-browser component tests; **45 stories × 2 brands × 2 themes** pass axe; 34 Playwright runs across two apps; Lighthouse accessibility **100** |
| Correct money handling | Unit tests for exact parsing ("19.99" → 1999), IDR, INR lakh grouping, and the select-all-and-retype regression |
| Secure | Bank app passes e2e with **zero CSP violations** under `script-src 'self'; style-src 'self'`; zero runtime dependencies; npm provenance; CycloneDX SBOM per release |
| Fast and small | `Button` alone is **365 B** brotli (tree-shaking proven in CI); whole library 10.6 kB; Lighthouse performance 92–100 |
| Requirements to code | [Transfer spec](specs/transfer-flow.md) and [booking spec](specs/booking-flow.md): every acceptance criterion names the test that proves it |
| Maintainable | 49 governance-tool tests; [adoption report](governance/adoption-report.md): 127 usages, 0 deprecated, 0 raw controls |

## Found and fixed by building the reference apps

These bugs would have reached consumer teams; dogfooding caught them first:

- Focus ring at 2.0:1 against white (fails WCAG 1.4.11). Now 5.0:1, and a test measures it.
- AmountInput rewrote its text on focus, so select-all-and-type *appended* digits.
- OTP `maxLength` truncated a pasted "987 654" before stripping the space.
- Radio descriptions were part of the accessible name ("Jurong West Medical Centre West").
- Tailwind's preflight flattened Dialog headings; the kit now sets its own weights.
- A sticky header hid focused content on phones (WCAG 2.4.11).
- Nested CSS grids made the transactions table push the page past 320px (WCAG 1.4.10).

## Where to look first

1. **The bank:** the overview, then *Pay & transfer*. Switch the market to 香港 or Indonesia, then toggle dark mode.
2. **Storybook:** *Foundations › Brands* (two brands on one page, live contrast report), then *Banking › Combobox*.
3. **The code:** `packages/ui/src/components/AmountInput.tsx`, `Combobox.tsx`, `packages/ui/scripts/build-tokens.mjs`.
