# Contributing

Thanks for helping. This guide is also the team's written standard: anything here that can be checked by a tool is checked in CI, and the rest is in the PR checklist.

## Setup

```bash
npm install
npx playwright install chromium   # once, for browser and e2e tests
npm run storybook                 # component workshop at http://localhost:6006
npm run dev                       # reference PWA at http://localhost:5173
```

Node 22+ for development (the package itself supports Node 20.19+).

| Command | What it does |
|---|---|
| `npm run lint` / `npm run format` | ESLint (typescript-eslint, react-hooks, jsx-a11y) / Prettier |
| `npm test` | Vitest: jsdom unit tests + real-Chromium browser tests |
| `npm run test:e2e` | Playwright on desktop and Pixel 7 |
| `npm run test:storybook -w @nisakhantalib/my-ui-kit` | axe on every story, light and dark (after `npm run build:storybook`) |
| `npm run size` | Bundle budgets |
| `npm run ci` | Everything CI runs except e2e |

## How a component gets added

1. **Issue** with the *Component request* template: user need, evidence, design.
2. **Spec** in `docs/specs/components/` from [the template](docs/specs/component-spec-template.md): anatomy, API, states, keyboard, ARIA, analytics events, test plan. Agree it with design and one consumer team before writing code.
3. **Story first.** Write the Storybook stories for every state in the spec. This is what design reviews.
4. **Build and test** to the definition of done below.
5. **Changeset** (`npm run changeset`) describing the change for the CHANGELOG.

A significant architectural choice (new dependency, new build output, a pattern other components will copy) also gets an ADR in `docs/adr/`.

## Definition of done for a component

- [ ] Follows its [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern, or uses a native element
- [ ] Keyboard: every action works without a mouse; focus is visible and never lost
- [ ] Screen reader: name, role, value and state are correct; changes are announced where needed
- [ ] Unit tests (behaviour, ARIA wiring) and an axe test in jsdom
- [ ] Real-browser test if it depends on focus, layout or colour
- [ ] Stories for every state; the Storybook audit passes in light and dark
- [ ] Target size ≥ 24px (we aim for 44px); text contrast ≥ 4.5:1, UI and focus ≥ 3:1
- [ ] Works at 320px wide and 200% zoom; respects `prefers-reduced-motion` and forced colours
- [ ] Row added to [ACCESSIBILITY.md](ACCESSIBILITY.md); exported from `src/index.ts`; size budget still passes

## API conventions

These keep the library predictable. A reviewer will point to this list.

| Rule | Example |
|---|---|
| Native element first; extend its props | `TextFieldProps extends InputHTMLAttributes<HTMLInputElement>` |
| Forward refs to the main element | `forwardRef<HTMLButtonElement, ButtonProps>` |
| Controlled + uncontrolled through `useControllableState` | `value` / `defaultValue` / `onValueChange` |
| Event-style names for change callbacks | `onValueChange`, `onCheckedChange`, not `onSelect` / `setValue` |
| Compound components for structure, props for options | `<Tabs><TabList><Tab/></TabList><TabPanel/></Tabs>` |
| Required accessible name is a required prop | `label: string`, `legend: string` |
| Field wiring through `useFieldIds` + `FieldHint` / `FieldError` | every form control reads hint and error the same way |
| Variants are string unions, not booleans | `variant="danger"`, not `isDanger` |
| No layout margins on components | spacing belongs to the page |
| Classes are `kit-block__element--modifier`, styles in `@layer kit.components` | consumers override without `!important` |
| Colours, spacing and radius only from tokens | `var(--kit-primary)`, never `#0b5cad` |
| Analytics through `useTrack()`, never a vendor SDK | `track('tab_change', { component: 'Tabs', tab })` |

## Accessibility rules we don't bend

- `aria-disabled` instead of `disabled` on buttons, so they stay discoverable.
- Live regions must exist **before** their content changes (see `Announcer`, `Toast`, `FieldError`).
- Nothing auto-dismisses if it contains an action (WCAG 2.2.1).
- Never remove focus outlines; use `:focus-visible` and the `--kit-focus` token.
- Colour is never the only signal: errors have text and an icon, alert tones have a spoken prefix.

## Code style

Prettier formats, ESLint judges correctness, and neither is up for debate in review. Comments explain **why**, not what. Strict TypeScript with `noUncheckedIndexedAccess`; no `any` in public types.

TypeScript 7 (native compiler) does type-checking and emits the `.d.ts` files. typescript-eslint still needs the TypeScript 6 JavaScript API, so the repo root pins `typescript@~6.0` for linting only.

## Commits and releases

[Conventional Commits](https://www.conventionalcommits.org/) (`feat(ui): add Switch`, `fix(dialog): restore focus`). Versions follow semver and are driven by changesets:

| Change | Bump |
|---|---|
| Bug fix, a11y fix, docs | patch |
| New component, new prop, new token | minor |
| Removed or renamed prop, changed default, token rename | major (with a migration note in the changeset) |

Merging to `main` opens a *Version Packages* PR; merging that publishes to npm with provenance (see the README).

## Code of conduct

Everyone taking part follows our [Code of Conduct](CODE_OF_CONDUCT.md).
