# 0005. Design tokens in one JSON file, generated for each platform

- **Status:** Accepted
- **Date:** 2026-10-22

## Context

The same colours and spacing are needed in several places:

- CSS for the web components
- Tailwind in consumer apps
- JavaScript for canvas charts, email templates and native status-bar colours in the Capacitor shell
- Figma, for designers

Copying values by hand drifts: the focus colour had already drifted from the documented contrast (2.0:1, below WCAG 1.4.11's 3:1).

## Decision

- `packages/ui/tokens/tokens.json` is the only place a value is written, in the W3C Design Tokens Community Group shape (`$value`, `$type`, `$description`; dark values in `$extensions.mode.dark`). That shape imports into Figma (Tokens Studio) and Style Dictionary.
- `npm run tokens` generates:
  - `src/tokens.css`: custom properties for light, `prefers-color-scheme: dark`, and `[data-theme=dark]`, inside `@layer kit.tokens`
  - `src/tokens.ts`: a typed `tokens` export (`tokens.color.primary.dark`)
- CI runs `tokens:check` and fails if the generated files are stale.
- The JSON ships in the package (`@nisakhantalib/my-ui-kit/tokens.json`) for other platforms' tooling.
- Contrast is **measured**, not asserted. A browser test computes the focus-ring ratio in both themes, and the Showcase page measures every token from live CSS.

A small in-repo script rather than Style Dictionary: 21 tokens and two outputs don't justify a dependency. Switch when we need Android XML / iOS Swift outputs; the JSON shape is already compatible.

## Consequences

- One PR changes a colour everywhere, and review sees the contrast note next to the value.
- Generated files are committed, so a diff shows exactly what consumers get.
