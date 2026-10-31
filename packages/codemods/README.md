# @nisakhantalib/my-ui-kit-codemods

[jscodeshift](https://github.com/facebook/jscodeshift) transforms that migrate apps across [`@nisakhantalib/my-ui-kit`](https://github.com/nisakhantalib/my-ui-kit/tree/main/packages/ui) deprecations and breaking changes.

```bash
# commit first, then
npx @nisakhantalib/my-ui-kit-codemods <transform> <paths...> [--dry] [--print] [--silent]
```

The CLI (`my-ui-kit-codemod`) uses the `tsx` parser, handles `.ts/.tsx/.js/.jsx`, and skips `node_modules`, `dist`, `build` and `coverage`.

| Transform | Since | Change |
|---|---|---|
| `error-summary-focus-on-show` | 0.2.0 | `autoFocus` → `focusOnShow` on `ErrorSummary` imported from the kit, including `import { ErrorSummary as X }` and `import * as Kit`. Other components' `autoFocus` is untouched |

Each transform has input/output fixtures in `transforms/__testfixtures__/`. Run `npm test` in this package.

Deprecation policy and when codemods ship: [docs/governance.md](https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/governance.md#running-a-codemod). MIT licensed.
