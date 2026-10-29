import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { afterAll, describe, expect, it } from 'vitest';
import plugin from '../src/index.js';

// RuleTester drives its own describe/it; point it at Vitest's.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.afterAll = afterAll;

// The TypeScript parser, because consumer apps are TSX and import type syntax must not trip the rules.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const KIT = "import { Button } from '@nisakhantalib/my-ui-kit';\n";

ruleTester.run('no-hardcoded-colors', plugin.rules['no-hardcoded-colors'], {
  valid: [
    '<div style={{ color: "var(--kit-text)", padding: 8 }} />',
    '<div className="bg-[var(--kit-surface)] text-sm" />',
    '<div className="bg-red-500" />',
    // Colours outside style/className are copy, not styling.
    '<p title="#fff is white">hex</p>',
    '<a href="/page#abc123" className="link">x</a>',
  ],
  invalid: [
    {
      code: '<div style={{ color: "#ff0000" }} />',
      errors: [{ messageId: 'style', data: { value: '#ff0000' } }],
    },
    {
      code: '<div style={{ background: "rgb(0 0 0 / 0.5)", borderColor: `hsl(10, 50%, 50%)` }} />',
      errors: [
        { messageId: 'style', data: { value: 'rgb(0 0 0 / 0.5)' } },
        { messageId: 'style', data: { value: 'hsl(10, 50%, 50%)' } },
      ],
    },
    {
      code: '<div style={{ border: "1px solid #FFF" }} />',
      errors: [{ messageId: 'style', data: { value: '#FFF' } }],
    },
    {
      code: '<div className="p-2 bg-[#ff0000] text-[rgb(0_0_0)]" />',
      errors: [
        { messageId: 'className', data: { value: 'bg-[#ff0000]' } },
        { messageId: 'className', data: { value: 'text-[rgb(0_0_0)]' } },
      ],
    },
    {
      code: '<div className={cx("p-2", active && "border-[color:#0b5cad]")} />',
      errors: [{ messageId: 'className', data: { value: 'border-[color:#0b5cad]' } }],
    },
    {
      code: '<div className={`p-2 ${x} bg-[#abc]`} />',
      errors: [{ messageId: 'className', data: { value: 'bg-[#abc]' } }],
    },
  ],
});

ruleTester.run('prefer-kit-components', plugin.rules['prefer-kit-components'], {
  valid: [
    // Not opted in to the kit: raw elements are this file's business.
    '<button type="button">Go</button>',
    `${KIT}<Button>Go</Button>`,
    `${KIT}<input type="date" />`,
    `${KIT}<input type={kind} />`,
    { code: `${KIT}<button type="button">Go</button>`, options: [{ allow: ['button'] }] },
    { code: `${KIT}<input type="radio" />`, options: [{ allow: ['input[type=radio]'] }] },
    { code: `${KIT}<input type="text" />`, options: [{ allow: ['input'] }] },
  ],
  invalid: [
    {
      code: `${KIT}<button type="button">Go</button>`,
      errors: [{ messageId: 'preferKit', data: { element: '<button>', component: 'Button' } }],
    },
    {
      code: `${KIT}<><input type="checkbox" /><input type="radio" /><input /><input type="email" /><select /></>`,
      errors: [
        { messageId: 'preferKit', data: { element: '<input type="checkbox">', component: 'Checkbox' } },
        { messageId: 'preferKit', data: { element: '<input type="radio">', component: 'RadioGroup' } },
        { messageId: 'preferKit', data: { element: '<input type="text">', component: 'TextField' } },
        { messageId: 'preferKit', data: { element: '<input type="email">', component: 'TextField' } },
        { messageId: 'preferKit', data: { element: '<select>', component: 'Select' } },
      ],
    },
    {
      // Import below the JSX still counts.
      code: "const x = <select />;\nimport * as Kit from '@nisakhantalib/my-ui-kit';",
      errors: [{ messageId: 'preferKit', data: { element: '<select>', component: 'Select' } }],
    },
    {
      code: `${KIT}<><button /><input type="checkbox" /></>`,
      options: [{ allow: ['button'] }],
      errors: [{ messageId: 'preferKit', data: { element: '<input type="checkbox">', component: 'Checkbox' } }],
    },
  ],
});

ruleTester.run('no-deprecated-props', plugin.rules['no-deprecated-props'], {
  valid: [
    "import { ErrorSummary } from '@nisakhantalib/my-ui-kit';\n<ErrorSummary errors={e} focusOnShow />",
    // Same name, different package: not ours to judge.
    "import { ErrorSummary } from './local';\n<ErrorSummary autoFocus />",
    // Other kit components keep autoFocus.
    "import { TextField } from '@nisakhantalib/my-ui-kit';\n<TextField label='x' autoFocus />",
    // Not imported at all.
    '<ErrorSummary autoFocus />',
  ],
  invalid: [
    {
      code: "import { ErrorSummary } from '@nisakhantalib/my-ui-kit';\n<ErrorSummary errors={e} autoFocus={false} />",
      output:
        "import { ErrorSummary } from '@nisakhantalib/my-ui-kit';\n<ErrorSummary errors={e} focusOnShow={false} />",
      errors: [
        {
          messageId: 'deprecated',
          data: {
            component: 'ErrorSummary',
            prop: 'autoFocus',
            replacement: 'focusOnShow',
            deprecatedIn: '0.2.0',
            removedIn: '1.0.0',
            codemod: ' Codemod: npx my-ui-kit-codemod error-summary-focus-on-show <paths>',
          },
        },
      ],
    },
    {
      code: "import { ErrorSummary as Summary } from '@nisakhantalib/my-ui-kit';\n<Summary autoFocus />",
      output: "import { ErrorSummary as Summary } from '@nisakhantalib/my-ui-kit';\n<Summary focusOnShow />",
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: "import * as Kit from '@nisakhantalib/my-ui-kit';\n<Kit.ErrorSummary autoFocus errors={[]} />",
      output: "import * as Kit from '@nisakhantalib/my-ui-kit';\n<Kit.ErrorSummary focusOnShow errors={[]} />",
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // Both set: renaming would duplicate the prop, so report without a fix.
      code: "import { ErrorSummary } from '@nisakhantalib/my-ui-kit';\n<ErrorSummary autoFocus focusOnShow={false} />",
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
  ],
});

describe('configs.recommended', () => {
  it('enables every rule, colours as a warning', () => {
    const { rules, plugins } = plugin.configs.recommended;
    expect(plugins?.['my-ui-kit']).toBe(plugin);
    expect(Object.keys(rules ?? {}).sort()).toEqual(
      Object.keys(plugin.rules ?? {})
        .map((r) => `my-ui-kit/${r}`)
        .sort(),
    );
    expect(rules).toMatchObject({
      'my-ui-kit/no-hardcoded-colors': 'warn',
      'my-ui-kit/prefer-kit-components': 'error',
      'my-ui-kit/no-deprecated-props': 'error',
    });
  });

  it('documents every rule with a link to its governance.md section', () => {
    for (const [name, rule] of Object.entries(plugin.rules ?? {})) {
      expect(rule.meta?.docs?.description).toBeTruthy();
      expect(rule.meta?.docs?.url).toMatch(new RegExp(`docs/governance\\.md#${name}$`));
    }
  });
});
