# 0009. Govern the library with a lint plugin, codemods and an adoption scanner

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The kit is meant to be shared across a bank's product teams: hundreds of developers, many repos, release cycles we don't control. Written standards (CONTRIBUTING.md, the deprecation policy) don't scale to that on their own. Three questions kept coming back:

- How do teams find out they are using something we have deprecated, before the major that removes it?
- How do they migrate without hand-editing every file?
- How do we know who uses what, so we can decide what to build, what to remove and when a major is safe?

## Options considered

1. **Documentation and release notes only**: no tooling cost, but relies on every developer reading every changelog; in practice deprecations are discovered when the build breaks
2. **Runtime telemetry from the components**: exact production usage, but needs analytics consent, production access and a data pipeline, and can't see code that isn't shipped yet
3. **Static tooling in the monorepo**: an ESLint plugin, jscodeshift codemods and a source scanner, published next to the kit
4. **A commercial adoption platform** (e.g. Omlet): rich dashboards, but another vendor, procurement, and source code leaving the bank's network

## Decision

Option 3, as three packages under `packages/`, versioned and released with the kit:

- **`@nisakhantalib/eslint-plugin-my-ui-kit`** (ESLint 9 flat config): `no-hardcoded-colors`, `prefer-kit-components`, `no-deprecated-props` (with autofix). Feedback in the editor is the cheapest place to catch drift.
- **`@nisakhantalib/my-ui-kit-codemods`**: jscodeshift transforms behind one CLI, `my-ui-kit-codemod <transform> <paths>`. Every mechanical breaking change ships with one.
- **`@nisakhantalib/my-ui-kit-scanner`**: `kit-scan`, which parses source with the TypeScript compiler API (syntax only; teams already have TypeScript) and reports component usage, props, deprecated usages, raw controls next to kit imports, and kit versions, as JSON plus Markdown.
- **One deprecation table**, `packages/scanner/deprecations.json`, read by both the lint rule and the scanner, so the editor and the adoption report can never disagree.
- Rules resolve JSX names through the file's imports (aliases and namespace imports included), so they only judge real kit components and stay quiet on lookalikes.

## Consequences

- A deprecation is now a checklist with tooling behind each step: dev warning, `deprecations.json` entry (lint + scanner pick it up automatically), codemod, changeset. See [governance.md](../governance.md#deprecation-policy).
- The scanner can gate a major: `kit-scan --fail-on-deprecated` across consumer repos must pass before removal.
- Static analysis misses dynamic usage (`<Comp {...props} />` with a computed component, props spread from objects); the scanner counts spreads as `{...spread}` so the gap is visible rather than hidden.
- Three more packages to maintain and release. They share the kit's CI (lint, Prettier, Vitest) and stay small: plain ESM JavaScript with JSDoc types, no build step.
- If usage data from production is ever needed, it can be added through the existing analytics adapters ([ADR 0007](0007-vendor-neutral-analytics.md)) without replacing any of this.
