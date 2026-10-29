import { docsUrl } from '../docs-url.js';

// A hard-coded colour skips theming (dark mode, forced colours, a rebrand) and the contrast
// checks the tokens were tuned for. Only style props and className strings are checked: those
// are where colours leak in app code, and checking every string would flag copy and URLs.
const CSS_COLOUR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?)\([^)]*\)/gi;
// Tailwind arbitrary values: bg-[#ff0000], text-[rgb(0_0_0)], border-[color:#fff]
const TAILWIND_ARBITRARY_COLOUR = /\b[\w-]+-\[(?:color:)?(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?)\([^\]]*\))\]/gi;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hard-coded colours in style props and Tailwind arbitrary classes; use --kit-* tokens',
      recommended: true,
      url: docsUrl('no-hardcoded-colors'),
    },
    schema: [],
    messages: {
      style:
        'Hard-coded colour "{{ value }}" in a style prop. Use a design token instead, e.g. "var(--kit-primary)" or "var(--kit-text)".',
      className:
        'Hard-coded colour "{{ value }}" in className. Use a token-backed class or an arbitrary token value, e.g. "bg-[var(--kit-surface)]".',
    },
  },
  create(context) {
    /**
     * @param {any} node
     * @param {string} text
     * @param {RegExp} pattern
     * @param {'style' | 'className'} messageId
     */
    const check = (node, text, pattern, messageId) => {
      for (const match of text.matchAll(pattern)) {
        context.report({ node, messageId, data: { value: match[0] } });
      }
    };

    /** @param {any} node */
    const stringValue = (node) =>
      node.type === 'Literal' && typeof node.value === 'string'
        ? node.value
        : node.type === 'TemplateElement'
          ? (node.value.cooked ?? node.value.raw)
          : undefined;

    /** @param {any} node */
    const onStyleString = (node) => {
      // Object keys are property names, never colours.
      if (node.parent?.type === 'Property' && node.parent.key === node && !node.parent.computed) return;
      const text = stringValue(node);
      if (text !== undefined) check(node, text, CSS_COLOUR, 'style');
    };

    /** @param {any} node */
    const onClassString = (node) => {
      const text = stringValue(node);
      if (text !== undefined) check(node, text, TAILWIND_ARBITRARY_COLOUR, 'className');
    };

    return {
      'JSXAttribute[name.name="style"] Literal': onStyleString,
      'JSXAttribute[name.name="style"] TemplateElement': onStyleString,
      'JSXAttribute[name.name="className"] Literal': onClassString,
      'JSXAttribute[name.name="className"] TemplateElement': onClassString,
    };
  },
};
