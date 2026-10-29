# 0001. Monorepo: library plus a reference app that consumes the built package

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

A component library is only proven when a real product uses it. Unit tests show that a component works on its own. They do not show that the published package installs cleanly, that the CSS loads in the right order next to an app's own styles, or that the components compose into a full journey (validation, focus moving across steps, a dialog over a form, offline).

## Options considered

1. **Library repo only, with Storybook.** Simple, but nothing exercises the package as a consumer would.
2. **Separate repos for the library and the app.** Realistic, but every change needs a publish before it can be tested.
3. **One repo with npm workspaces** (`packages/ui`, `apps/demo`). The app depends on `@nisakhantalib/my-ui-kit` by name and resolves to the local workspace.

## Decision

Option 3. The demo imports the **built** library (`dist/`, through the `exports` map), never `../src`, so it sees exactly what an npm consumer sees. `npm run dev` and CI build the library first.

npm workspaces, not pnpm, Nx or Turborepo: with two packages, the extra tool would cost more than it saves. Revisit when there are more than about five packages or the build time hurts.

## Consequences

- E2E tests cover the real integration: package exports, CSS layer order next to Tailwind, providers, PWA.
- A breaking API change fails the demo's typecheck in the same PR.
- The demo doubles as living documentation of "how a team should use this".
- The library must be built before the app runs, which costs about a second.
