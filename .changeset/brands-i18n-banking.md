---
'@nisakhantalib/my-ui-kit': minor
---

- **Multi-brand tokens:** palette, semantic and component tiers; `civic` and `orchid` brands scoped with `data-brand` (any element, so pages can mix brands). The token build fails if a brand drifts from the contract or any of 80 WCAG contrast checks fails. New tokens: `--kit-accent`, `--kit-brand-surface(-end)`, `--kit-on-brand-surface`, `--kit-button-radius`, `--kit-control-height`, `--kit-card-radius`. New exports `brandTokens`, `brands`, `contrastReport`.
- **`KitProvider` / `useKit`:** locale, currency and the library's own strings (English, Traditional Chinese, Bahasa Indonesia), exact minor-unit money parsing and formatting.
- **Banking components:** `AmountInput`, `OTPInput`, `Combobox`, `DataTable`, `MaskedValue`, `Badge`, `Skeleton`.
- **Deprecated:** `ErrorSummary autoFocus`. Use `focusOnShow`; it still works with a dev-only warning until 1.0.0. Codemod: `npx @nisakhantalib/my-ui-kit-codemods error-summary-focus-on-show src/`.
- **Fixes:** headings in Dialog and ErrorSummary set their own weight, so CSS resets such as Tailwind preflight don't flatten them; the ErrorSummary count is read as "There is a problem (2 errors)".
