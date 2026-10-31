# 0005. Tiered, multi-brand design tokens, generated for each platform

- **Status:** Accepted (revised 2026-10-31: one file became three tiers and three brands)
- **Date:** 2026-10-22

## Context

The same colours and spacing are needed in many places: CSS for the components, Tailwind in apps, JavaScript for charts and native status bars, and Figma for designers. The library also serves **more than one brand**: a public-sector default (Civic), a retail-bank brand (Orchid) and its premium tier (Private), across five markets. Values copied by hand drift. The focus colour had already drifted below WCAG 1.4.11 (2.0:1, where 3:1 is required).

## Decision

**Three tiers**, in `packages/ui/tokens/`, using the W3C Design Tokens shape (`$value`, `$type`, `$description`, with dark values in `$extensions.mode.dark`). Tokens Studio for Figma and Style Dictionary both read this shape.

| Tier | File | Example | Used by |
|---|---|---|---|
| 1. Palette | `palette.json` | `palette.violet.700 = #6a1fb0` | brands only, never components |
| 2. Semantic | `brands/<brand>.json` → `color.*`, `radius`, `font` | `color.primary = {palette.violet.700}` | components |
| 3. Component | `brands/<brand>.json` → `component.*` | `component.button.radius = 999px` | one component |

- **Brands are scoped by attribute**: `:root` gets the default brand (`civic`), and `[data-brand="orchid"]` on any element re-brands that subtree. Pages can mix brands; components never know which brand they're in.
- **Component tokens alias semantic tokens as `var()`** (`--kit-button-radius: var(--kit-radius)`), so overriding a semantic token flows through.
- **Separate roles for separate jobs.** `primary` is for text and controls, so in dark mode it gets lighter to keep contrast. `brand-surface` is for large brand panels and stays saturated in dark mode. This came from building the bank's balance card, which looked washed out on `primary`.

**The build enforces it.** `npm run tokens` (`scripts/build-tokens.mjs`) fails if:

- an alias doesn't resolve
- a brand is missing a token the default brand has, or adds one it doesn't (the brand contract)
- any pair in `contrast.json` falls below its minimum in any brand × mode. There are 80 checks: text 4.5:1, UI and focus 3:1, `on-brand-surface` on both gradient stops

It generates `src/tokens.css` (inside `@layer kit.tokens`) and `src/tokens.ts`, which exports `tokens`, `brandTokens`, `brands` and `contrastReport`. CI runs `tokens:check`. The JSON ships in the package as `@nisakhantalib/my-ui-kit/tokens/*`.

We use a small in-repo script, not Style Dictionary: two outputs and two brands don't justify the dependency, and we need the contrast gate, which Style Dictionary doesn't provide. Switch when Android XML or iOS Swift outputs are needed; the JSON shape is already compatible.

## Consequences

- A new brand is one JSON file. It can't ship if it breaks the contract or contrast.
- One PR changes a colour everywhere, and review sees the measured ratios (Storybook › Foundations › Brands shows the full report).
- Generated files are committed, so diffs show exactly what consumers get.
