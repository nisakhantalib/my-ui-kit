// Builds design tokens: tokens/*.json -> src/tokens.css + src/tokens.ts.
//   node scripts/build-tokens.mjs           write the files
//   node scripts/build-tokens.mjs --check   fail if they are out of date (CI)
//
// Three tiers (ADR 0005):
//   1. palette.json        raw values, never emitted as CSS variables
//   2. brands/<b>.json     semantic tokens (color.primary, radius, font) aliasing the palette
//   3. brands/<b>.json     component tokens (component.button.radius) aliasing tier 2
// Every brand must define exactly the same token names (the contract), and every pair in
// contrast.json must meet WCAG in every brand and mode, or the build fails.
//
// Naming: path joined with "-", prefixed --kit-; the "color" and "component" groups are dropped,
// so color.text -> --kit-text, component.button.radius -> --kit-button-radius.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => JSON.parse(readFileSync(new URL(file, root), 'utf8'));

const palette = read('tokens/palette.json');
const shared = read('tokens/shared.json');
const { pairs } = read('tokens/contrast.json');
const DEFAULT_BRAND = 'civic';
const brandNames = readdirSync(new URL('tokens/brands/', root))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .sort((a, b) => (a === DEFAULT_BRAND ? -1 : b === DEFAULT_BRAND ? 1 : a.localeCompare(b)));
const brands = Object.fromEntries(brandNames.map((b) => [b, read(`tokens/brands/${b}.json`)]));

/** Flatten to [{ path, value, dark, description }], skipping $-prefixed keys. */
function flatten(node, path = []) {
  if ('$value' in node) {
    return [{ path, value: node.$value, dark: node.$extensions?.mode?.dark, description: node.$description }];
  }
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => flatten(child, [...path, key]));
}

const errors = [];
const lookup = (tree, path) => path.split('.').reduce((n, k) => n?.[k], tree);
const cssName = (path) => `--kit-${(['color', 'component'].includes(path[0]) ? path.slice(1) : path).join('-')}`;
const cssValue = (v) => (Array.isArray(v) ? v.map((f) => (f.includes(' ') ? `'${f}'` : f)).join(', ') : v);

/**
 * Resolve "{a.b.c}". Palette aliases become the raw value; aliases to another brand token stay
 * as var(--kit-…) in CSS, so overriding --kit-radius also moves --kit-button-radius.
 */
function resolve(value, brand, { forCss }) {
  if (typeof value !== 'string' || !/^\{.+\}$/.test(value)) return value;
  const ref = value.slice(1, -1);
  if (ref.startsWith('palette.')) {
    const hit = lookup(palette, ref);
    if (!hit) errors.push(`${brand}: unknown alias ${value}`);
    return hit?.$value;
  }
  const hit = lookup(brands[brand], ref) ?? lookup(shared, ref);
  if (!hit) {
    errors.push(`${brand}: unknown alias ${value}`);
    return undefined;
  }
  return forCss ? `var(${cssName(ref.split('.'))})` : resolve(hit.$value, brand, { forCss });
}

const sharedTokens = flatten(shared);
const resolved = Object.fromEntries(
  brandNames.map((brand) => [
    brand,
    flatten(brands[brand]).map((t) => ({
      ...t,
      name: cssName(t.path),
      css: {
        light: resolve(t.value, brand, { forCss: true }),
        dark: t.dark && resolve(t.dark, brand, { forCss: true }),
      },
      raw: {
        light: resolve(t.value, brand, { forCss: false }),
        dark: resolve(t.dark ?? t.value, brand, { forCss: false }),
      },
    })),
  ]),
);

// ---- Contract: every brand implements the same tokens ----
const names = (brand) => resolved[brand].map((t) => t.name).sort();
for (const brand of brandNames.slice(1)) {
  const missing = names(DEFAULT_BRAND).filter((n) => !names(brand).includes(n));
  const extra = names(brand).filter((n) => !names(DEFAULT_BRAND).includes(n));
  if (missing.length) errors.push(`${brand}: missing ${missing.join(', ')}`);
  if (extra.length) errors.push(`${brand}: not in ${DEFAULT_BRAND} contract: ${extra.join(', ')}`);
}

// ---- Contrast: WCAG 2.x relative luminance ----
function luminance(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const report = [];
for (const brand of brandNames) {
  const color = (name, mode) => resolved[brand].find((t) => t.path[0] === 'color' && t.path[1] === name)?.raw[mode];
  for (const mode of ['light', 'dark']) {
    for (const [fg, bg, min] of pairs) {
      const r = ratio(color(fg, mode), color(bg, mode));
      report.push({ brand, mode, pair: `${fg} on ${bg}`, ratio: Number(r.toFixed(2)), min, pass: r >= min });
      if (r < min) errors.push(`${brand}/${mode}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
    }
  }
}

if (errors.length) {
  console.error(`Token build failed:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

// ---- CSS ----
const decls = (list, mode, indent) =>
  list
    .filter((t) => mode === 'light' || t.dark)
    .map(
      (t) =>
        `${indent}${t.name ?? cssName(t.path)}: ${cssValue(mode === 'light' ? (t.css?.light ?? t.value) : t.css.dark)};`,
    )
    .join('\n');

/** Brands apply to :root (default brand) or to any element with data-brand, so a subtree can be re-branded. */
function selectors(brand, darkPrefix) {
  const scopes = brand === DEFAULT_BRAND ? [':root', `[data-brand='${brand}']`] : [`[data-brand='${brand}']`];
  if (!darkPrefix) return scopes.join(',\n  ');
  return scopes
    .flatMap((s) => (s === ':root' ? [darkPrefix] : [`${darkPrefix} ${s}`, `${darkPrefix}${s}`]))
    .join(',\n  ');
}

const blocks = brandNames.map((brand) => {
  const list = resolved[brand];
  return `  /* ---- ${brand}${brand === DEFAULT_BRAND ? ' (default)' : ''} ---- */
  ${selectors(brand)} {
${decls(list, 'light', '    ')}
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    ${selectors(brand, ":root:not([data-theme='light'])").replaceAll('\n  ', '\n    ')} {
${decls(list, 'dark', '      ')}
      color-scheme: dark;
    }
  }
  ${selectors(brand, ":root[data-theme='dark']")} {
${decls(list, 'dark', '    ')}
    color-scheme: dark;
  }`;
});

const css = `/* Generated from tokens/*.json by scripts/build-tokens.mjs. Do not edit. */

@layer kit.tokens {
  :root {
${decls(sharedTokens, 'light', '    ')}
  }

${blocks.join('\n\n')}
}
`;

// ---- TS ----
function toObject(list) {
  const out = {};
  for (const t of list) {
    let node = out;
    t.path.slice(0, -1).forEach((key) => (node = node[key] ??= {}));
    node[t.path.at(-1)] = t.path[0] === 'color' ? { light: t.raw.light, dark: t.raw.dark } : (t.raw?.light ?? t.value);
  }
  return out;
}
const brandObjects = Object.fromEntries(
  brandNames.map((b) => [b, { ...toObject(resolved[b]), ...toObject(sharedTokens) }]),
);

const ts = `// Generated from tokens/*.json by scripts/build-tokens.mjs. Do not edit.
// The same values as the CSS custom properties, for places CSS can't reach:
// React Native, Capacitor status-bar colours, canvas/charts, email templates.

export const brandTokens = ${JSON.stringify(brandObjects, null, 2)} as const;

export type Brand = keyof typeof brandTokens;
export const brands = Object.keys(brandTokens) as Brand[];

/** Tokens of the default brand (${DEFAULT_BRAND}). */
export const tokens = brandTokens.${DEFAULT_BRAND};
export type Tokens = typeof tokens;

/** Contrast of every required pair, per brand and mode, as measured at build time. */
export const contrastReport = ${JSON.stringify(report)} as const;
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
  console.log(`Tokens are up to date (${brandNames.length} brands, ${report.length} contrast checks pass).`);
} else {
  for (const [file, content] of outputs) writeFileSync(new URL(file, root), content);
  const weakest = [...report].sort((a, b) => a.ratio / a.min - b.ratio / b.min).slice(0, 3);
  console.log(
    `Wrote ${outputs.map(([f]) => f).join(', ')}: ${brandNames.join(', ')}; ${report.length} contrast checks pass.`,
  );
  console.log(
    `Closest to the limit: ${weakest.map((w) => `${w.brand}/${w.mode} ${w.pair} ${w.ratio}:1 (min ${w.min})`).join('; ')}`,
  );
}
