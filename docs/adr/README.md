# Architecture decision records

Short records of decisions that shape the library, so new contributors (and future us) know *why*, not just *what*. Format: context → decision → consequences, after [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

| # | Decision | Status |
|---|---|---|
| [0001](0001-monorepo-library-plus-reference-app.md) | Monorepo: library + reference app that consumes the built package | Accepted |
| [0002](0002-esm-only-per-module-output.md) | ESM only, one output file per module, React as a peer | Accepted |
| [0003](0003-css-custom-properties-and-cascade-layers.md) | Plain CSS with custom properties and cascade layers, not CSS-in-JS | Accepted |
| [0004](0004-native-elements-first.md) | Native HTML elements first, custom ARIA widgets only when needed | Accepted |
| [0005](0005-design-tokens-single-source.md) | Design tokens in one JSON file, generated for each platform | Accepted |
| [0006](0006-testing-strategy.md) | Four test layers, with real-browser tests for anything visual | Accepted |
| [0007](0007-vendor-neutral-analytics.md) | Vendor-neutral analytics with Adobe adapters | Accepted |
| [0008](0008-hybrid-native-with-capacitor.md) | Native apps through a Capacitor shell, not a React Native rewrite | Accepted |
| [0009](0009-governance-tooling.md) | Govern the library with a lint plugin, codemods and an adoption scanner | Accepted |

New ADR: copy [the template](template.md), take the next number, open a PR. Superseded ADRs stay, marked *Superseded by 00xx*.
