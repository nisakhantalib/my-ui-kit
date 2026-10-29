# 0002. ESM only, one output file per module, React as a peer

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Consumers range from Vite SPAs to Next.js App Router (React Server Components) to older webpack setups. The package must load everywhere, tree-shake well, and never bundle a second copy of React.

## Options considered

1. **Dual CJS + ESM.** Maximum reach, but two copies of the code can both load ("dual package hazard"), which breaks React context.
2. **ESM only, single bundle.** Simple, but whether unused components get removed depends on the consumer's bundler.
3. **ESM only, one file per source module** (`preserveModules`), with `sideEffects` declared.

## Decision

Option 3.

- Node 20.19+ can `require()` ESM, and every current bundler reads ESM, so CJS adds risk without adding reach.
- `preserveModules` keeps `dist/components/Button.js` and friends as separate files, so tree-shaking works even with weaker bundlers. `size-limit` proves it in CI: importing only `Button` costs about 0.4 kB brotlied, against about 5.3 kB for everything.
- `"sideEffects": ["**/*.css"]` tells bundlers that JS files can be dropped but the stylesheet cannot.
- Modules that use hooks get a `'use client'` banner, so Next.js App Router can import them from Server Components. `tokens.js` and `utils.js` stay server-safe.
- `react` and `react-dom` are `peerDependencies` (`>=18`) and external in the build.
- Types are emitted by `tsc` and checked by **publint** and **Are the Types Wrong** in CI.

## Consequences

- Very old Node/CJS-only toolchains must use dynamic `import()`. Accepted; attw shows this as the only "ignored" result.
- `dist/` has many small files. Harmless for bundlers, and source maps map one-to-one to `src/`.
