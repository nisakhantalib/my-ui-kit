# Governance

How `@nisakhantalib/my-ui-kit` is run as a shared library for a bank: hundreds of developers across many product teams, one set of components, one accessibility bar. The library only works if teams can trust it, so the rules below aim at three things: **changes are predictable**, **breaking changes never surprise anyone**, and **we can measure whether it is working**.

Anything here that a tool can check is checked by a tool:

| Package | What it does |
|---|---|
| [`@nisakhantalib/eslint-plugin-my-ui-kit`](../packages/eslint-plugin) | Lint rules: tokens over hard-coded colours, kit components over raw controls, no deprecated props (with autofix) |
| [`@nisakhantalib/my-ui-kit-codemods`](../packages/codemods) | `my-ui-kit-codemod`: jscodeshift transforms that do a migration for you |
| [`@nisakhantalib/my-ui-kit-scanner`](../packages/scanner) | `kit-scan`: adoption report (usage, props, deprecated props, raw controls, kit versions) |

The deprecation table that drives the lint rule and the scanner is one file, [`packages/scanner/deprecations.json`](../packages/scanner/deprecations.json). See [ADR 0009](adr/0009-governance-tooling.md) for why the tooling looks like this.

## Who does what

**Core team** (design-system maintainers, CODEOWNERS for `packages/ui`):

- owns the roadmap, the API conventions in [CONTRIBUTING.md](../CONTRIBUTING.md) and the accessibility bar in [ACCESSIBILITY.md](../ACCESSIBILITY.md)
- reviews and merges every library change; at least one core reviewer plus a design reviewer for anything visual
- cuts releases, writes migration notes, maintains the codemods and lint rules
- runs office hours and the support rota (below)

**Contributing teams** (product squads that use the kit):

- propose components and changes through the RFC process; build them with core-team review (we prefer this to the core team becoming a bottleneck)
- own their app's adoption: keep the lint config on, run codemods within the deprecation window
- nominate a **kit champion** per team: the first contact for questions and the reviewer for that team's kit upgrades

**Design** owns Figma and the tokens' intent; code owns the token values in `packages/ui/tokens/tokens.json` ([ADR 0005](adr/0005-design-tokens-single-source.md)). A token change needs both.

## Proposing a change (RFC and spec)

| Change | Process |
|---|---|
| Bug, a11y fix, docs | Issue or PR directly |
| New prop or variant | Issue describing the need; core team agrees the API in the issue before code |
| New component, or anything breaking | **RFC**: an issue with the *Component request* template, then a spec PR from [the component spec template](specs/component-spec-template.md) |
| New dependency, build output or cross-cutting pattern | Spec plus an [ADR](adr/README.md) |

An RFC must show **evidence of need from at least two teams** (a component one product needs belongs in that product), the accessibility pattern it follows, and its analytics events. The spec is agreed with design and one consumer team **before** code ([CONTRIBUTING.md](../CONTRIBUTING.md#how-a-component-gets-added)). RFCs stay open for comment for at least five working days so teams in other time zones and release cycles can respond.

## Versioning and releases

- **Semver, strictly.** The public API is everything exported from `src/index.ts`, every prop, every CSS custom property and BEM class documented in Storybook, and `tokens.json`. The bump table is in [CONTRIBUTING.md](../CONTRIBUTING.md#commits-and-releases).
- **Changesets.** Every library PR adds a changeset (`npm run changeset`) written for consumers: what changed, and for a minor or major, what they need to do. Merging to `main` opens a *Version Packages* PR; merging that publishes to npm with provenance.
- **Release cadence.** Patches as needed, minors on a regular cadence (fortnightly), majors at most twice a year, announced a release ahead.
- The governance packages are versioned with the kit: a release that deprecates something ships the matching lint rule entry and codemod in the same release.

## Deprecation policy

Breaking changes are how a shared library loses trust. Nothing is removed without warning, a tool to find it, and a tool to fix it.

1. **Deprecate in a minor.** The old API keeps working. The same release ships:
   - a **dev-only warning** (`console.warn` once per component, stripped from production builds) naming the replacement
   - an entry in [`deprecations.json`](../packages/scanner/deprecations.json), which turns on [`no-deprecated-props`](#no-deprecated-props) and the scanner's deprecated-usage report
   - a **codemod** when the migration is mechanical ([`my-ui-kit-codemod`](#running-a-codemod))
   - a changeset with the migration note, and the `@deprecated` JSDoc tag so editors strike it through
2. **Keep it for at least one minor release** (in practice, at least one full release cycle, longer for wide usage). Use [`kit-scan`](#running-the-scanner) across consumer repos to see who is still on the old API, and contact those teams directly.
3. **Remove in the next major.** The major's changeset links the codemod. The scanner report should show zero remaining usages before the major is cut; if it doesn't, the removal waits.

Current deprecations:

| Component | Prop | Use instead | Deprecated in | Removed in | Codemod |
|---|---|---|---|---|---|
| `ErrorSummary` | `autoFocus` | `focusOnShow` | 0.2.0 | 1.0.0 | `error-summary-focus-on-show` |

This entry is the worked example of the policy, scheduled for the 0.2.0 minor. `autoFocus` is being retired on `ErrorSummary` because it isn't the native attribute: the summary moves focus each time a *new* set of errors appears, not on mount. Sharing the native name confused both developers and `jsx-a11y/no-autofocus`.

## Adoption metrics

We measure adoption so decisions (what to build, what to deprecate, when a major is safe) are made with data. [`kit-scan`](#running-the-scanner) reads source code, so it needs no runtime instrumentation and no access to production. It reports:

- **Coverage**: files and packages using the kit, and which **kit version** each `package.json` depends on (how far behind are teams?)
- **Usage**: JSX usages per component and per file; **props used per component** (which options matter, which are dead weight)
- **Deprecated usages**: with file, line and the codemod to run. This is the gate for removing them
- **Adoption gaps**: raw `<button>`, `<input>` and `<select>` in files that already import the kit, the clearest signal that a component is missing something a team needed

Each consumer repo runs `kit-scan` in CI and uploads the JSON; the core team aggregates the reports monthly. The current report for this repo's reference app is in [`docs/governance/adoption-report.md`](governance/adoption-report.md).

## Support

| Need | Channel | Response |
|---|---|---|
| Question, "how do I…?" | `#my-ui-kit` chat channel; kit champion in your team | Same working day |
| Bug | GitHub issue (*Bug* template), with a Storybook or StackBlitz repro | Triage within 2 working days |
| Accessibility defect | Issue labelled `a11y`; treated as a bug, never a feature request | Triage within 1 working day |
| Security issue | [SECURITY.md](../SECURITY.md), never a public issue | Per policy |
| Proposal | RFC (above) | Discussed at the fortnightly design-system review |
| Pairing on a migration or contribution | Weekly office hours | Booked slot |

## Lint rules

Add the plugin to an app's `eslint.config.js`:

```js
import kit from '@nisakhantalib/eslint-plugin-my-ui-kit';

export default [
  // …your config
  kit.configs.recommended,
];
```

`recommended` turns on all three rules: `no-hardcoded-colors` as a warning (an existing app has many, and they need judgement), the other two as errors.

### no-hardcoded-colors

Reports hex, `rgb()`/`rgba()` and `hsl()`/`hsla()` colours in JSX `style={{…}}` props, and Tailwind arbitrary colour classes (`bg-[#ff0000]`, `text-[rgb(0_0_0)]`, `border-[color:#fff]`) in `className` strings, including strings inside `cx(…)` calls and template literals.

Why: a literal colour skips dark mode, forced colours and future rebrands, and none of the contrast checks the tokens were tuned for apply to it.

```tsx
// ✗
<div style={{ color: '#0b5cad' }} className="bg-[#f6f7f9]" />
// ✓
<div style={{ color: 'var(--kit-primary)' }} className="bg-[var(--kit-surface)]" />
```

No autofix: picking the right token is a design decision (the same hex can be `--kit-primary` or a one-off).

### prefer-kit-components

In files that import from `@nisakhantalib/my-ui-kit`, reports raw controls that have a kit equivalent:

| Raw element | Use |
|---|---|
| `<button>` | `Button` |
| `<input type="checkbox">` | `Checkbox` |
| `<input type="radio">` | `RadioGroup` + `Radio` |
| `<input>`, `<input type="text">`, `<input type="email">` | `TextField` |
| `<select>` | `Select` |

Why: the kit's controls bring the label, hint and error wiring, target sizes and analytics. Files that don't import the kit are left alone; that app hasn't opted in yet. Inputs with a dynamic `type` are skipped.

Options: `allow` lists elements this codebase may keep, for example a custom widget the kit doesn't cover yet:

```js
'my-ui-kit/prefer-kit-components': ['error', { allow: ['input[type=radio]', 'select'] }],
```

Entries are `button`, `select`, `input` (every type) or `input[type=<type>]`. If you need an allow entry, tell us in `#my-ui-kit`: it is usually a missing feature.

### no-deprecated-props

Reports props listed in [`deprecations.json`](../packages/scanner/deprecations.json) on kit components, with the version it was deprecated in, the version it will be removed in and the codemod to run. **Autofix** (`eslint --fix`) renames the prop to its replacement.

It only fires on elements imported from the kit, by any name: `import { ErrorSummary as Summary }` and `import * as Kit` (`<Kit.ErrorSummary>`) are both covered, while an unrelated `ErrorSummary` from another package is not. When both the old and the new prop are set, it reports without a fix, because a human has to decide which value wins.

```tsx
// ✗ "autoFocus" on <ErrorSummary> is deprecated since 0.2.0 and will be removed in 1.0.0. Use "focusOnShow" instead.
<ErrorSummary errors={errors} autoFocus={false} />
// ✓ after --fix
<ErrorSummary errors={errors} focusOnShow={false} />
```

## Running a codemod

Codemods rewrite whole codebases in one command and are the fastest way across a deprecation. Commit first, then:

```bash
npx @nisakhantalib/my-ui-kit-codemods error-summary-focus-on-show src/
# or, with the package installed
npx my-ui-kit-codemod error-summary-focus-on-show src/ --dry --print   # preview
npx my-ui-kit-codemod error-summary-focus-on-show src/                 # apply
```

The CLI wraps jscodeshift with the `tsx` parser, handles `.ts/.tsx/.js/.jsx` and skips `node_modules`, `dist`, `build` and `coverage`. Run `my-ui-kit-codemod --help` for the list of transforms.

| Transform | Does | Leaves alone |
|---|---|---|
| `error-summary-focus-on-show` | `autoFocus` → `focusOnShow` on `ErrorSummary` imported from the kit (aliases and namespace imports included) | `autoFocus` on every other component and element; elements that already set `focusOnShow` (the lint rule flags those) |

Afterwards run your formatter and `eslint` (the lint rule confirms nothing was missed), and review the diff.

## Running the scanner

```bash
npx kit-scan src/                                         # Markdown summary to stdout
npx kit-scan apps/ packages/ --json kit-report.json --markdown kit-report.md
npx kit-scan src/ --json kit-report.json --fail-on-deprecated   # CI gate before a major
```

It walks `.ts/.tsx/.js/.jsx` files (skipping `node_modules`, `dist`, `build`, `coverage`, `android`, `ios`, `storybook-static`), parses them with the TypeScript compiler API (syntax only, so it is fast and needs no tsconfig) and reads every `package.json` it finds for the kit version. The JSON schema is documented in the [scanner README](../packages/scanner/README.md#report-schema).

In this repo, `npm run report -w @nisakhantalib/my-ui-kit-scanner` regenerates [`docs/governance/adoption-report.json`](governance/adoption-report.json) and [`.md`](governance/adoption-report.md) from `apps/`.
