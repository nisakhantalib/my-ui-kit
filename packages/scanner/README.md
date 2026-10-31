# @nisakhantalib/my-ui-kit-scanner

`kit-scan`: an adoption report for [`@nisakhantalib/my-ui-kit`](https://github.com/nisakhantalib/my-ui-kit/tree/main/packages/ui), from source code.

```bash
npx kit-scan <dir...> [--json out.json] [--markdown out.md] [--root dir] [--fail-on-deprecated]
```

- Walks `.ts/.tsx/.js/.jsx` (not `.d.ts`), skipping `node_modules`, `dist`, `build`, `coverage`, `android`, `ios`, `storybook-static`
- Parses with the TypeScript compiler API (`typescript` is a peer dependency; syntax only, no tsconfig needed)
- Resolves JSX names through each file's imports, so `import { ErrorSummary as Summary }` and `<Kit.Button>` count, and lookalikes from other packages don't
- With no output flags, prints Markdown to stdout. `--fail-on-deprecated` exits 1 if any deprecated prop is used

Also usable as a library: `import { scan, scanSource, toMarkdown } from '@nisakhantalib/my-ui-kit-scanner'`.

`deprecations.json` is the single source of deprecated kit APIs; the ESLint plugin's `no-deprecated-props` reads it too.

## Report schema

`schemaVersion: 1`. Paths are relative to `--root` (default: the current directory), with `/` separators. Count maps are sorted by count, descending.

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | `1` | Bumped on any breaking change to this shape |
| `generatedAt` | ISO 8601 string | When the scan ran |
| `kitPackage` | string | `"@nisakhantalib/my-ui-kit"` |
| `roots` | string[] | Directories scanned |
| `summary.filesScanned` | number | Source files parsed |
| `summary.filesImportingKit` | number | Files with an import from the kit (type-only imports included) |
| `summary.componentsUsed` | number | Distinct kit components rendered |
| `summary.jsxUsages` | number | Total JSX elements that are kit components |
| `summary.deprecatedUsages` | number | Length of `deprecatedUsages` |
| `summary.rawElementsInKitFiles` | number | Raw `<button>` / `<input>` / `<select>` in files that import the kit |
| `packages[]` | `{ path, name, kitVersion, dependencyType }` | Every scanned `package.json` that depends on the kit; `dependencyType` is `dependencies`, `peerDependencies` or `devDependencies` |
| `components.<Name>` | `{ files, usages, props, byFile }` | Per component: number of files, total usages, `props` (prop name → count; spreads as `"{...spread}"`), `byFile` (file → usages). Ordered by usages |
| `deprecatedUsages[]` | `{ file, line, column, component, prop, replacement, deprecatedIn, removedIn, codemod }` | One per deprecated prop use; 1-based line and column |
| `adoptionGaps.totals` | element → count | Raw controls in kit files. Keys: `button`, `select`, `input[type=<type>]` (`text` when no type, `?` when computed) |
| `adoptionGaps.byFile` | file → (element → count) | The same, per file |
| `files[]` | `{ file, imports, usages, rawElements }` | Per file that imports the kit: kit exports imported, usages per component, raw controls |

MIT licensed. Governance model and how the report is used: [docs/governance.md](https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/governance.md#adoption-metrics).
