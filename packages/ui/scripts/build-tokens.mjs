// Generates src/tokens.css and src/tokens.ts from tokens/tokens.json.
//   node scripts/build-tokens.mjs           write the files
//   node scripts/build-tokens.mjs --check   fail if they are out of date (CI)
//
// Naming: path segments joined with "-", prefixed --kit-. The "color" group is dropped,
// so color.text -> --kit-text and space.4 -> --kit-space-4.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const source = JSON.parse(readFileSync(new URL('tokens/tokens.json', root), 'utf8'));

/** Flatten to [{ path, value, dark, description }], skipping $-prefixed keys. */
function flatten(node, path = []) {
  if ('$value' in node) {
    return [{ path, value: node.$value, dark: node.$extensions?.mode?.dark, description: node.$description }];
  }
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => flatten(child, [...path, key]));
}

const tokens = flatten(source);
const cssName = (path) => `--kit-${(path[0] === 'color' ? path.slice(1) : path).join('-')}`;
const cssValue = (v) => (Array.isArray(v) ? v.map((f) => (f.includes(' ') ? `'${f}'` : f)).join(', ') : v);

const decls = (mode, indent) =>
  tokens
    .filter((t) => mode === 'light' || t.dark)
    .map((t) => `${indent}${cssName(t.path)}: ${cssValue(mode === 'light' ? t.value : t.dark)};`)
    .join('\n');

const css = `/* Generated from tokens/tokens.json by scripts/build-tokens.mjs. Do not edit. */

@layer kit.tokens {
  :root {
${decls('light', '    ')}
    color-scheme: light; /* native controls (date picker, scrollbars) follow the theme */
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
${decls('dark', '      ')}
      color-scheme: dark;
    }
  }

  /* An explicit choice from a theme toggle wins over the system setting. */
  :root[data-theme='dark'] {
${decls('dark', '    ')}
    color-scheme: dark;
  }
}
`;

/** Nested object for JS consumers; colours become { light, dark }. */
function toObject(list) {
  const out = {};
  for (const t of list) {
    let node = out;
    t.path.slice(0, -1).forEach((key) => (node = node[key] ??= {}));
    node[t.path.at(-1)] = t.path[0] === 'color' ? { light: t.value, dark: t.dark ?? t.value } : t.value;
  }
  return out;
}

const ts = `// Generated from tokens/tokens.json by scripts/build-tokens.mjs. Do not edit.
// The same values as the CSS custom properties, for places CSS can't reach:
// React Native, Capacitor status-bar colours, canvas/charts, email templates.

export const tokens = ${JSON.stringify(toObject(tokens), null, 2)} as const;

export type Tokens = typeof tokens;
`;

const outputs = [
  ['src/tokens.css', css],
  ['src/tokens.ts', ts],
];

if (process.argv.includes('--check')) {
  const stale = outputs.filter(([file, content]) => {
    try {
      return readFileSync(new URL(file, root), 'utf8').replaceAll('\r\n', '\n') !== content;
    } catch {
      return true;
    }
  });
  if (stale.length) {
    console.error(`Out of date: ${stale.map(([f]) => f).join(', ')}. Run \`npm run tokens\`.`);
    process.exit(1);
  }
  console.log('Tokens are up to date.');
} else {
  for (const [file, content] of outputs) writeFileSync(new URL(file, root), content);
  console.log(`Wrote ${outputs.map(([f]) => f).join(', ')} (${tokens.length} tokens).`);
}
