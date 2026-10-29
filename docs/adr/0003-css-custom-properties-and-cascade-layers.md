# 0003. Plain CSS with custom properties and cascade layers, not CSS-in-JS

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Consumer teams style their apps in different ways: Tailwind, SCSS, CSS Modules, styled-components. The library's styles must:

- theme at runtime (light/dark, brand), without a rebuild
- work in React Server Components
- be easy to override without `!important`
- add zero runtime JavaScript

## Options considered

| Option | Runtime cost | RSC | Override story | Verdict |
|---|---|---|---|---|
| styled-components / Emotion | JS at runtime, style injection | Needs a client registry | Specificity games | ✗ |
| Tailwind classes inside components | None | ✓ | Consumers need Tailwind and the same config | ✗ for a shared library |
| Zero-runtime CSS-in-JS (PandaCSS, StyleX, vanilla-extract) | None | ✓ | Good | A strong option, but adds a build plugin for every consumer |
| **Plain CSS, BEM-style `kit-` classes, tokens as custom properties, `@layer`** | None | ✓ | Layers | ✓ |

## Decision

One stylesheet (`@nisakhantalib/my-ui-kit/styles.css`):

- **Tokens** are CSS custom properties (`--kit-primary`), generated from `tokens/` (ADR 0005). Themes switch by `prefers-color-scheme` or `<html data-theme="dark">`.
- **Cascade layers:** everything is in `@layer kit.tokens, kit.components`. Un-layered app CSS always wins, whatever its specificity.
- With **Tailwind**, the app declares `@layer theme, base, kit, components, utilities;` before both imports, so Tailwind's preflight can't reset kit buttons but utilities (`className="mt-4"`) still override them. The demo app does exactly this, and maps Tailwind's theme onto the kit tokens (`--color-brand: var(--kit-primary)`) so app and components share one palette.

## Consequences

- No runtime styling cost; components render the same on the server and the client.
- Consumers must import the CSS once. Documented in the README and in the Storybook introduction.
- Class names are public API: renaming one is a breaking change.
