// @ts-check
// Lint rules are the written-down team standard (see CONTRIBUTING.md): correctness first,
// accessibility second, style last (style is Prettier's job, so no formatting rules here).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '.claude/**',
      '**/dist/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/android/**',
      '**/ios/**',
      '**/dev-dist/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      // Our components forward their own ARIA props, so these can't be judged statically.
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      // tabpanel (APG) and region: scrollable areas must be focusable to scroll by keyboard (axe scrollable-region-focusable).
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'], tags: [] }],
    },
  },
  {
    files: ['packages/ui/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.tsx', '**/*.stories.tsx'],
    rules: {
      // Library code must not log; analytics adapters are the one deliberate exception.
      'no-console': ['error', { allow: ['warn', 'info'] }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/e2e/**'],
    rules: { 'jsx-a11y/no-autofocus': 'off' },
  },
  prettier,
);
