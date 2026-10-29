import pkg from '../package.json' with { type: 'json' };
import noDeprecatedProps from './rules/no-deprecated-props.js';
import noHardcodedColors from './rules/no-hardcoded-colors.js';
import preferKitComponents from './rules/prefer-kit-components.js';

const { name, version } = pkg;

/** @type {import('eslint').ESLint.Plugin & { configs: Record<string, import('eslint').Linter.Config> }} */
const plugin = {
  meta: { name, version },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'prefer-kit-components': preferKitComponents,
    'no-deprecated-props': noDeprecatedProps,
  },
  configs: {},
};

// Colours warn because a migration of an existing app turns up many of them; the other two
// are cheap to fix (one has an autofix) and guard against real regressions, so they error.
plugin.configs.recommended = {
  name: 'my-ui-kit/recommended',
  plugins: { 'my-ui-kit': plugin },
  rules: {
    'my-ui-kit/no-hardcoded-colors': 'warn',
    'my-ui-kit/prefer-kit-components': 'error',
    'my-ui-kit/no-deprecated-props': 'error',
  },
};

export default plugin;
