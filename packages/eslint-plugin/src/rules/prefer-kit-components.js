import { docsUrl } from '../docs-url.js';
import { createKitImports } from '../kit-imports.js';

// Only files that already import the kit are checked: there the team has opted in, so a raw
// control is an adoption gap (missing label wiring, error states, analytics), not a choice.
const INPUT_TYPES = /** @type {const} */ ({
  checkbox: 'Checkbox',
  radio: 'RadioGroup',
  text: 'TextField',
  email: 'TextField',
});

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer kit components over raw <button>, <input> and <select> in files that use the kit',
      recommended: true,
      url: docsUrl('prefer-kit-components'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
            description: 'Elements to allow: "button", "select", "input" (any type) or "input[type=checkbox]"',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferKit: 'Use <{{ component }}> from @nisakhantalib/my-ui-kit instead of a raw {{ element }}.',
    },
  },
  create(context) {
    const allow = new Set(context.options[0]?.allow ?? []);
    const kit = createKitImports();
    /** @type {{ node: any, element: string, component: string }[]} */
    const candidates = [];

    return {
      ImportDeclaration: (node) => kit.onImport(node),
      /** @param {any} node */
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        const tag = node.name.name;
        if (tag === 'button' || tag === 'select') {
          if (!allow.has(tag))
            candidates.push({ node, element: `<${tag}>`, component: tag[0].toUpperCase() + tag.slice(1) });
          return;
        }
        if (tag !== 'input' || allow.has('input')) return;
        const typeAttr = node.attributes.find(
          (/** @type {any} */ a) => a.type === 'JSXAttribute' && a.name.name === 'type',
        );
        // No type attribute means a text input; a dynamic type can't be judged statically.
        const type = typeAttr
          ? typeAttr.value?.type === 'Literal'
            ? String(typeAttr.value.value)
            : undefined
          : 'text';
        if (type === undefined || !Object.hasOwn(INPUT_TYPES, type)) return;
        if (allow.has(`input[type=${type}]`)) return;
        candidates.push({
          node,
          element: `<input type="${type}">`,
          component: INPUT_TYPES[/** @type {keyof typeof INPUT_TYPES} */ (type)],
        });
      },
      // Decided at the end because an import can legally appear below the JSX that uses it.
      'Program:exit'() {
        if (!kit.importsKit) return;
        for (const { node, element, component } of candidates) {
          context.report({ node, messageId: 'preferKit', data: { element, component } });
        }
      },
    };
  },
};
