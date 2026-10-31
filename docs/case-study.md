# Case study: a shared component library for a multi-market bank

**One page for reviewers.** What problem this solves, the decisions that matter, and the evidence, each with a link to the code.

## The problem

A regional bank has many product teams in several markets (here: Singapore, Hong Kong, Taiwan, Indonesia, India). Without a shared library each team rebuilds forms, amount fields, OTP entry and tables. The result is inconsistent UX, repeated accessibility bugs, money-handling bugs, and brand drift. A library only helps if teams **adopt** it and it **stays correct as it grows**, so the work is half components and half governance.

## What I built

| | |
|---|---|
| **The library** (`packages/ui`) | 23 accessible React components, including the hard banking ones: APG **Combobox** (payee search), **AmountInput** (integer minor units, locale parsing), **OTPInput** (one field, SMS autofill), sortable **DataTable**, **MaskedValue** |
| **Tokens and brands** (`packages/ui/tokens`) | Three-tier tokens (palette → semantic → component), three brands (Civic, Orchid, Private), light/dark. **The build fails if any of 120 WCAG contrast pairs drops below its minimum** |
| **Markets** (`KitProvider`) | Locale, currency and the library's own words in English, Traditional Chinese and Bahasa Indonesia |
| **Reference bank** (`apps/bank`) | Orchid Bank, a fictional bank built on research into leading banking apps: Home, Activity, Pay & transfer (payee → amount → review → OTP → receipt), Cards, Settings. 5 markets, 3 languages, strict CSP, installable PWA and Android app |
| **Three brands** | Civic (default), Orchid and Orchid Private: one component set, re-skinned only by tokens; the bank previews the Private tier live |
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
| Accessible | 87 jsdom + 8 real-browser component tests; **54 stories × 3 brands × 2 themes** pass axe; every page passes axe in light and dark on desktop and phone; Lighthouse accessibility **100** on every page |
| Correct money handling | Unit tests for exact parsing ("19.99" → 1999), IDR, INR lakh grouping, and the select-all-and-retype regression |
| Secure | Bank app passes e2e with **zero CSP violations** under `script-src 'self'; style-src 'self'`; zero runtime dependencies; CycloneDX SBOM with every release |
| Fast and small | `Button` alone is **365 B** brotli (tree-shaking proven in CI); whole library 10.9 kB; less-visited pages load lazily; Lighthouse performance 95–100 |
| Requirements to code | [Transfer spec](specs/transfer-flow.md): every acceptance criterion names the test that proves it |
| Maintainable | 49 governance-tool tests; [adoption report](governance/adoption-report.md): 62 usages of 21 exports, 0 deprecated, and 2 raw controls flagged (see below) |

## Found and fixed by building the reference app

These bugs would have reached consumer teams; dogfooding caught them first:

- Focus ring at 2.0:1 against white (fails WCAG 1.4.11). Now 5.0:1, and a test measures it.
- AmountInput rewrote its text on focus, so select-all-and-type *appended* digits.
- OTP `maxLength` truncated a pasted "987 654" before stripping the space.
- Radio descriptions were part of the accessible name ("Jurong West Medical Centre West").
- Tailwind's preflight flattened Dialog headings; the kit now sets its own weights.
- A sticky header hid focused content on phones (WCAG 2.4.11).
- Nested CSS grids made the transactions table push the page past 320px (WCAG 1.4.10).
- Button didn't lay out icon children (Tailwind makes `svg` a block), so icons stacked above labels.
- Two logos on one page shared a gradient `id`; with the first hidden, the visible one painted blank.
- Icon-only and avatar links had names that didn't contain their visible text (WCAG 2.5.3 Label in Name).
- Focus didn't reach lazily loaded pages' headings after navigation; headings now take focus on mount.
- A warmer gold for the Private brand dropped white-on-accent to 4.29:1; the token build refused it.

## What the governance tooling found in our own app

The adoption scanner flags two raw `<button>`s in files that already import the kit: the Activity filter chips and the recent-payee picker. Both are toggle-button groups. That's the signal working as intended: a pattern teams need that the library doesn't have yet. It goes on the backlog as a `ToggleGroup` spec, rather than every team re-implementing `aria-pressed` chips.

## Where to look first

1. **The bank:** Home, then *Pay & transfer* (try *Pay* on the SP Group bill). Open *Settings*: switch the market to 香港 or Indonesia, dark mode, and the Private tier. Freeze the card on *Cards*.
2. **Storybook:** *Foundations › Brands* (three brands on one page, live contrast report), then *Banking › Combobox* and *Governance › Adoption report*.
3. **The code:** `packages/ui/src/components/AmountInput.tsx`, `Combobox.tsx`, `packages/ui/scripts/build-tokens.mjs`.
