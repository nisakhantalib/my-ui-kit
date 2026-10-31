# @nisakhantalib/eslint-plugin-my-ui-kit

ESLint 9 (flat config) rules that keep apps on [`@nisakhantalib/my-ui-kit`](https://github.com/nisakhantalib/my-ui-kit/tree/main/packages/ui) tokens, components and current APIs.

```bash
npm install -D @nisakhantalib/eslint-plugin-my-ui-kit
```

```js
// eslint.config.js
import kit from '@nisakhantalib/eslint-plugin-my-ui-kit';

export default [
  // …your config
  kit.configs.recommended,
];
```

| Rule | Recommended | Fix | What it reports |
|---|---|---|---|
| [`no-hardcoded-colors`](https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/governance.md#no-hardcoded-colors) | warn | | Hex / `rgb()` / `hsl()` in `style` props, Tailwind arbitrary colours (`bg-[#f00]`) in `className` |
| [`prefer-kit-components`](https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/governance.md#prefer-kit-components) | error | | Raw `<button>`, `<input>`, `<select>` in files that import the kit. Option: `allow` |
| [`no-deprecated-props`](https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/governance.md#no-deprecated-props) | error | ✓ | Deprecated props on kit components (aliases and namespace imports resolved); `--fix` renames them |

The deprecation table is shared with the adoption scanner: [`@nisakhantalib/my-ui-kit-scanner/deprecations.json`](../scanner/deprecations.json).

Full docs and the governance model: [docs/governance.md](https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/governance.md). MIT licensed.
