// The deprecation table lives in the scanner package so the lint rule and the adoption
// report can never disagree about what is deprecated.
import deprecations from '@nisakhantalib/my-ui-kit-scanner/deprecations.json' with { type: 'json' };
import { docsUrl } from '../docs-url.js';
import { createKitImports } from '../kit-imports.js';

/** @typedef {{ component: string, prop: string, replacement?: string, deprecatedIn: string, removedIn: string, codemod?: string }} Deprecation */

/** @type {Map<string, Map<string, Deprecation>>} component -> prop -> entry */
const byComponent = new Map();
for (const entry of /** @type {Deprecation[]} */ (deprecations.props)) {
  if (!byComponent.has(entry.component)) byComponent.set(entry.component, new Map());
  byComponent.get(entry.component)?.set(entry.prop, entry);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow props that the kit has deprecated, with an autofix to the replacement prop',
      recommended: true,
      url: docsUrl('no-deprecated-props'),
    },
    fixable: 'code',
    schema: [],
    messages: {
      deprecated:
        '"{{ prop }}" on <{{ component }}> is deprecated since {{ deprecatedIn }} and will be removed in {{ removedIn }}. Use "{{ replacement }}" instead.{{ codemod }}',
    },
  },
  create(context) {
    const kit = createKitImports();
    return {
      ImportDeclaration: (node) => kit.onImport(node),
      /** @param {any} node */
      JSXOpeningElement(node) {
        const component = kit.resolve(node.name);
        const table = component ? byComponent.get(component) : undefined;
        if (!component || !table) return;

        const present = new Set(
          node.attributes
            .filter((/** @type {any} */ a) => a.type === 'JSXAttribute')
            .map((/** @type {any} */ a) => a.name.name),
        );
        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute') continue;
          const entry = table.get(attr.name.name);
          if (!entry) continue;
          const { replacement } = entry;
          context.report({
            node: attr,
            messageId: 'deprecated',
            data: {
              component,
              prop: entry.prop,
              replacement: replacement ?? '(none)',
              deprecatedIn: entry.deprecatedIn,
              removedIn: entry.removedIn,
              codemod: entry.codemod ? ` Codemod: npx my-ui-kit-codemod ${entry.codemod} <paths>` : '',
            },
            // Renaming onto a prop that is already set would leave a duplicate, so that case
            // is reported without a fix and needs a human decision.
            fix: replacement && !present.has(replacement) ? (fixer) => fixer.replaceText(attr.name, replacement) : null,
          });
        }
      },
    };
  },
};
