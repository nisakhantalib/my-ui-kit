---
'@nisakhantalib/my-ui-kit': minor
---

- New components: `Select`, `Checkbox` (with indeterminate state), `RadioGroup` + `Radio` (plain and card variants), `Switch`, `Accordion` + `AccordionItem`, `Alert`, `ErrorSummary`, and `ToastProvider` + `useToast`.
- Design tokens now come from `tokens/tokens.json` (W3C Design Tokens format). New `tokens` export for JS and `./tokens.json` package export. New colour tokens `--kit-success` and `--kit-warning`.
- **Accessibility fix:** the light-theme focus ring (`--kit-focus`) was `#f5a524` at 2.0:1 against white, below WCAG 1.4.11's 3:1. It is now `#b45309` (5.0:1). Dark theme is unchanged (8.9:1).
- Styles are now in cascade layers (`kit.tokens`, `kit.components`), so un-layered app CSS overrides them without `!important`. Tailwind users: see the README for the one-line layer order.
- Build output is one ESM file per module (better tree-shaking), and hook-based modules carry `'use client'` for React Server Components. The main entry moved from `dist/my-ui-kit.js` to `dist/index.js`; import through the package name as before.
- `useControllableState` is exported for building your own controlled/uncontrolled components.
