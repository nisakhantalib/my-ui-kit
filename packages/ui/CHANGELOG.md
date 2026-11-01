# @nisakhantalib/my-ui-kit

## 0.2.0

### Minor Changes

- 2008a24: - **Multi-brand tokens:** palette, semantic and component tiers; `civic` and `orchid` brands scoped with `data-brand` (any element, so pages can mix brands). The token build fails if a brand drifts from the contract or any of 80 WCAG contrast checks fails. New tokens: `--kit-accent`, `--kit-brand-surface(-end)`, `--kit-on-brand-surface`, `--kit-button-radius`, `--kit-control-height`, `--kit-card-radius`. New exports `brandTokens`, `brands`, `contrastReport`.
  - **`KitProvider` / `useKit`:** locale, currency and the library's own strings (English, Traditional Chinese, Bahasa Indonesia), exact minor-unit money parsing and formatting.
  - **Banking components:** `AmountInput`, `OTPInput`, `Combobox`, `DataTable`, `MaskedValue`, `Badge`, `Skeleton`.
  - **Deprecated:** `ErrorSummary autoFocus`. Use `focusOnShow`; it still works with a dev-only warning until 1.0.0. Codemod: `npx @nisakhantalib/my-ui-kit-codemods error-summary-focus-on-show src/`.
  - **Fixes:** headings in Dialog and ErrorSummary set their own weight, so CSS resets such as Tailwind preflight don't flatten them; the ErrorSummary count is read as "There is a problem (2 errors)".
- b7aed89: - Add `adobeWebSdkAdapter` for Adobe Experience Platform Web SDK (alloy.js), Adobe's replacement for AppMeasurement. Uses the same `variableMap` / `eventMap` config, so switching is a one-line change.
  - `Dialog` now makes the rest of the page `inert` while open, so screen readers and Tab cannot reach content behind the modal.
  - Ship ESM only (`exports` with `types` + `default`), add `engines.node >= 20.19`, and fix type resolution under `moduleResolution: node16` (verified with publint and Are the Types Wrong).
  - Add `--kit-on-danger` token so danger buttons keep ≥ 4.5:1 text contrast in dark mode (was white on light coral). Dark tokens now also apply via `<html data-theme="dark">`, so apps can offer a theme toggle, and `color-scheme` follows the theme so native controls match.
- 7c0230d: - New components: `Select`, `Checkbox` (with indeterminate state), `RadioGroup` + `Radio` (plain and card variants), `Switch`, `Accordion` + `AccordionItem`, `Alert`, `ErrorSummary`, and `ToastProvider` + `useToast`.
  - Design tokens now come from `tokens/tokens.json` (W3C Design Tokens format). New `tokens` export for JS and `./tokens.json` package export. New colour tokens `--kit-success` and `--kit-warning`.
  - **Accessibility fix:** the light-theme focus ring (`--kit-focus`) was `#f5a524` at 2.0:1 against white, below WCAG 1.4.11's 3:1. It is now `#b45309` (5.0:1). Dark theme is unchanged (8.9:1).
  - Styles are now in cascade layers (`kit.tokens`, `kit.components`), so un-layered app CSS overrides them without `!important`. Tailwind users: see the README for the one-line layer order.
  - Build output is one ESM file per module (better tree-shaking), and hook-based modules carry `'use client'` for React Server Components. The main entry moved from `dist/my-ui-kit.js` to `dist/index.js`; import through the package name as before.
  - `useControllableState` is exported for building your own controlled/uncontrolled components.
- 5772d00: - **`Money`:** a headline amount in the market format with the cents de-emphasised (one run of text for screen readers).
  - **`Dialog`:** `placement="sheet"` (a side panel for details and side tasks) and `showClose` (a labelled close button).
  - **`RadioGroup`:** `variant="segmented"` (a compact one-line choice such as a chart range or filter) and `legendHidden`.
  - The CSS size budget moves from 4.5 kB to 5 kB for these styles.
- f1cef12: - **Orchid brand restyled:** a neutral graphite UI with a single cobalt accent (was violet and magenta), 10px buttons and controls, 16px cards. Dark mode, brand surface and focus colours updated to match.
  - **Contrast contract:** `accent` must now meet 4.5:1 on `bg` and `surface` (was 3:1 on `bg`), so it is safe for link text. 126 checks.
- 2db9cfc: - **New `Guilloche` component:** the engraved security pattern from banknotes and cheques, as deterministic SVG (`rosette` or `waves`), with an optional draw-in that respects reduced motion. Decorative and hidden from assistive technology.
  - **Font roles:** every brand now defines `--kit-font-display` (headings, headline amounts) and `--kit-font-mono` (account numbers) alongside `--kit-font`.
  - **New `brand-accent` colour token:** highlights on the brand surface (gains, chart lines, engraving), checked at 4.5:1 against both brand-surface stops. 138 contrast checks.
  - **Orchid brand restyled ("Intaglio"):** treasury green and paper, jade links, mint on the brand surface; Archivo, Hanken Grotesk and IBM Plex Mono; 12px radius, 20px cards.
