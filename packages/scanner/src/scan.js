// Adoption metrics for the kit, from source, without running or building the apps.
// The TypeScript compiler API parses JS and TS alike and is already in every consumer repo;
// only the syntax tree is used (no type-checking), so a scan of a large app takes seconds.
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import deprecations from '../deprecations.json' with { type: 'json' };

export const KIT_PACKAGE = deprecations.package;
export const SCHEMA_VERSION = 1;
export const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'android',
  'ios',
  'storybook-static',
  '.git',
]);
const RAW_ELEMENTS = new Set(['button', 'input', 'select']);
const SCRIPT_KINDS = /** @type {const} */ ({
  '.ts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
  '.js': ts.ScriptKind.JS,
  '.jsx': ts.ScriptKind.JSX,
});

/**
 * @typedef {{ component: string, prop: string, replacement?: string, deprecatedIn: string, removedIn: string, codemod?: string }} Deprecation
 * @typedef {{ file: string, line: number, column: number } & Deprecation} DeprecatedUsage
 * @typedef {{ file: string, imports: string[], usages: Record<string, number>, rawElements: Record<string, number> }} FileReport
 * @typedef {{ files: number, usages: number, props: Record<string, number>, byFile: Record<string, number> }} ComponentReport
 * @typedef {{ path: string, name: string, kitVersion: string, dependencyType: string }} PackageReport
 * @typedef {{
 *   schemaVersion: number,
 *   generatedAt: string,
 *   kitPackage: string,
 *   roots: string[],
 *   summary: {
 *     filesScanned: number, filesImportingKit: number, componentsUsed: number, jsxUsages: number,
 *     deprecatedUsages: number, rawElementsInKitFiles: number,
 *   },
 *   packages: PackageReport[],
 *   components: Record<string, ComponentReport>,
 *   deprecatedUsages: DeprecatedUsage[],
 *   adoptionGaps: { totals: Record<string, number>, byFile: Record<string, Record<string, number>> },
 *   files: FileReport[],
 * }} Report
 */

/** @type {Map<string, Map<string, Deprecation>>} */
const deprecatedProps = new Map();
for (const entry of /** @type {Deprecation[]} */ (deprecations.props)) {
  if (!deprecatedProps.has(entry.component)) deprecatedProps.set(entry.component, new Map());
  deprecatedProps.get(entry.component)?.set(entry.prop, entry);
}

/**
 * @param {string} dir
 * @param {{ sources: string[], manifests: string[] }} out
 */
function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (entry.name === 'package.json') {
      out.manifests.push(full);
    } else if (Object.hasOwn(SCRIPT_KINDS, extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
      out.sources.push(full);
    }
  }
}

/** @param {ts.JsxTagNameExpression} tag */
const tagText = (tag) => (ts.isIdentifier(tag) ? tag.text : undefined);

/**
 * Scans one file's source text. Exported so tests and editors can scan without a filesystem.
 * @param {string} file path used for reporting and to pick the parser (by extension)
 * @param {string} text
 */
export function scanSource(file, text) {
  const ext = /** @type {keyof typeof SCRIPT_KINDS} */ (extname(file));
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, SCRIPT_KINDS[ext] ?? ts.ScriptKind.TSX);

  /** @type {Map<string, string>} local name -> kit export */
  const named = new Map();
  /** @type {Set<string>} */
  const namespaces = new Set();
  let importsKit = false;
  /** @type {Record<string, number>} */
  const usages = {};
  /** @type {Record<string, Record<string, number>>} */
  const props = {};
  /** @type {Record<string, number>} */
  const raw = {};
  /** @type {Omit<DeprecatedUsage, 'file'>[]} */
  const deprecated = [];

  // Imports are hoisted, so collect them before judging any JSX.
  for (const stmt of source.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (stmt.moduleSpecifier.text !== KIT_PACKAGE) continue;
    importsKit = true;
    const clause = stmt.importClause;
    if (!clause || clause.isTypeOnly || !clause.namedBindings) continue;
    if (ts.isNamespaceImport(clause.namedBindings)) {
      namespaces.add(clause.namedBindings.name.text);
    } else {
      for (const el of clause.namedBindings.elements) {
        if (!el.isTypeOnly) named.set(el.name.text, (el.propertyName ?? el.name).text);
      }
    }
  }

  /** @param {ts.JsxTagNameExpression} tag */
  const resolveKit = (tag) => {
    if (ts.isIdentifier(tag)) return named.get(tag.text);
    if (ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression) && namespaces.has(tag.expression.text)) {
      return tag.name.text;
    }
    return undefined;
  };

  /** @param {ts.JsxOpeningElement | ts.JsxSelfClosingElement} el */
  const onElement = (el) => {
    const component = resolveKit(el.tagName);
    if (component) {
      usages[component] = (usages[component] ?? 0) + 1;
      const counts = (props[component] ??= {});
      for (const attr of el.attributes.properties) {
        const name = ts.isJsxAttribute(attr) ? attr.name.getText(source) : '{...spread}';
        counts[name] = (counts[name] ?? 0) + 1;
        const entry = deprecatedProps.get(component)?.get(name);
        if (entry) {
          const { line, character } = source.getLineAndCharacterOfPosition(attr.getStart(source));
          deprecated.push({ line: line + 1, column: character + 1, ...entry });
        }
      }
      return;
    }
    const tag = tagText(el.tagName);
    if (tag && RAW_ELEMENTS.has(tag)) {
      let key = tag;
      if (tag === 'input') {
        const type = el.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText(source) === 'type');
        const init = type && ts.isJsxAttribute(type) ? type.initializer : undefined;
        // A missing type is a text input; a computed one is reported as such rather than guessed.
        key = `input[type=${!type ? 'text' : init && ts.isStringLiteral(init) ? init.text : '?'}]`;
      }
      raw[key] = (raw[key] ?? 0) + 1;
    }
  };

  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) onElement(node);
    ts.forEachChild(node, visit);
  };
  visit(source);

  return {
    importsKit,
    imports: [...new Set(named.values())].sort(),
    usages,
    props,
    // Raw controls only matter where the team has opted in to the kit.
    rawElements: importsKit ? raw : {},
    deprecated,
  };
}

/**
 * @param {string} manifestPath
 * @returns {Omit<PackageReport, 'path'> | undefined}
 */
function readKitDependency(manifestPath) {
  /** @type {Record<string, any>} */
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return undefined;
  }
  for (const dependencyType of ['dependencies', 'peerDependencies', 'devDependencies']) {
    const version = pkg[dependencyType]?.[KIT_PACKAGE];
    if (typeof version === 'string') return { name: String(pkg.name ?? ''), kitVersion: version, dependencyType };
  }
  return undefined;
}

/** @param {Record<string, number>} counts */
const sortCounts = (counts) =>
  Object.fromEntries(Object.entries(counts).sort(([a, x], [b, y]) => y - x || a.localeCompare(b)));
/** @param {Record<string, any>} obj */
const sortKeys = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

/**
 * Scans directories and returns the adoption report (schema: README.md in this package).
 * @param {string[]} dirs
 * @param {{ root?: string, now?: Date }} [options] `root`: paths in the report are relative to it
 * @returns {Report}
 */
export function scan(dirs, { root = process.cwd(), now = new Date() } = {}) {
  const rel = (/** @type {string} */ p) => relative(root, p).replaceAll('\\', '/') || '.';
  const found = { sources: /** @type {string[]} */ ([]), manifests: /** @type {string[]} */ ([]) };
  for (const dir of dirs) walk(resolve(dir), found);
  found.sources.sort();
  found.manifests.sort();

  /** @type {Record<string, ComponentReport>} */
  const components = {};
  /** @type {DeprecatedUsage[]} */
  const deprecatedUsages = [];
  /** @type {FileReport[]} */
  const files = [];
  /** @type {Record<string, number>} */
  const gapTotals = {};
  /** @type {Record<string, Record<string, number>>} */
  const gapsByFile = {};

  for (const path of found.sources) {
    const file = rel(path);
    const result = scanSource(path, readFileSync(path, 'utf8'));
    if (!result.importsKit) continue;

    for (const [component, count] of Object.entries(result.usages)) {
      const c = (components[component] ??= { files: 0, usages: 0, props: {}, byFile: {} });
      c.files += 1;
      c.usages += count;
      c.byFile[file] = count;
      for (const [prop, n] of Object.entries(result.props[component] ?? {})) c.props[prop] = (c.props[prop] ?? 0) + n;
    }
    for (const d of result.deprecated) deprecatedUsages.push({ file, ...d });
    if (Object.keys(result.rawElements).length > 0) {
      gapsByFile[file] = sortKeys(result.rawElements);
      for (const [el, n] of Object.entries(result.rawElements)) gapTotals[el] = (gapTotals[el] ?? 0) + n;
    }
    files.push({
      file,
      imports: result.imports,
      usages: sortKeys(result.usages),
      rawElements: sortKeys(result.rawElements),
    });
  }

  for (const c of Object.values(components)) {
    c.props = sortCounts(c.props);
    c.byFile = sortKeys(c.byFile);
  }

  /** @type {PackageReport[]} */
  const packages = [];
  for (const manifest of found.manifests) {
    const dep = readKitDependency(manifest);
    if (dep) packages.push({ path: rel(manifest), ...dep });
  }

  const sortedComponents = Object.fromEntries(
    Object.entries(components).sort(([a, x], [b, y]) => y.usages - x.usages || a.localeCompare(b)),
  );
  const sum = (/** @type {number[]} */ ns) => ns.reduce((a, b) => a + b, 0);

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    kitPackage: KIT_PACKAGE,
    roots: dirs.map((d) => rel(resolve(d))),
    summary: {
      filesScanned: found.sources.length,
      filesImportingKit: files.length,
      componentsUsed: Object.keys(components).length,
      jsxUsages: sum(Object.values(components).map((c) => c.usages)),
      deprecatedUsages: deprecatedUsages.length,
      rawElementsInKitFiles: sum(Object.values(gapTotals)),
    },
    packages,
    components: sortedComponents,
    deprecatedUsages,
    adoptionGaps: { totals: sortCounts(gapTotals), byFile: gapsByFile },
    files,
  };
}

/** @param {string} s */
const cell = (s) => s.replaceAll('|', '\\|');

/**
 * Renders a report as Markdown for PRs, wikis and the docs site.
 * @param {Report} report
 * @param {{ topProps?: number }} [options]
 */
export function toMarkdown(report, { topProps = 6 } = {}) {
  const { summary } = report;
  const lines = [
    `# ${report.kitPackage} adoption report`,
    '',
    `Generated ${report.generatedAt} by \`kit-scan ${report.roots.join(' ')}\`.`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Files scanned | ${summary.filesScanned} |`,
    `| Files importing the kit | ${summary.filesImportingKit} |`,
    `| Kit components used | ${summary.componentsUsed} |`,
    `| JSX usages of kit components | ${summary.jsxUsages} |`,
    `| Deprecated prop usages | ${summary.deprecatedUsages} |`,
    `| Raw \`<button>\` / \`<input>\` / \`<select>\` in kit files | ${summary.rawElementsInKitFiles} |`,
    '',
    '## Kit version by package',
    '',
  ];

  if (report.packages.length === 0) lines.push('No scanned package.json depends on the kit.');
  else {
    lines.push('| package.json | Package | Kit version | Dependency type |', '| --- | --- | --- | --- |');
    for (const p of report.packages)
      lines.push(`| ${cell(p.path)} | ${cell(p.name)} | \`${p.kitVersion}\` | ${p.dependencyType} |`);
  }

  lines.push('', '## Components', '');
  if (summary.componentsUsed === 0) lines.push('No kit components found.');
  else {
    lines.push('| Component | Usages | Files | Most-used props |', '| --- | ---: | ---: | --- |');
    for (const [name, c] of Object.entries(report.components)) {
      const top = Object.entries(c.props)
        .slice(0, topProps)
        .map(([p, n]) => `\`${p}\` (${n})`)
        .join(', ');
      lines.push(`| ${name} | ${c.usages} | ${c.files} | ${cell(top) || '—'} |`);
    }
  }

  lines.push('', '## Deprecated prop usages', '');
  if (report.deprecatedUsages.length === 0) lines.push('None. Nothing blocks the next major.');
  else {
    lines.push(
      '| Location | Component | Prop | Use instead | Removed in | Codemod |',
      '| --- | --- | --- | --- | --- | --- |',
    );
    for (const d of report.deprecatedUsages) {
      lines.push(
        `| ${cell(d.file)}:${d.line}:${d.column} | ${d.component} | \`${d.prop}\` | \`${d.replacement ?? '—'}\` | ${d.removedIn} | ${d.codemod ? `\`${d.codemod}\`` : '—'} |`,
      );
    }
  }

  lines.push('', '## Adoption gaps (raw controls in files that import the kit)', '');
  const gapFiles = Object.entries(report.adoptionGaps.byFile);
  if (gapFiles.length === 0) lines.push('None.');
  else {
    lines.push('| File | Raw elements |', '| --- | --- |');
    for (const [file, counts] of gapFiles) {
      const list = Object.entries(counts)
        .map(([el, n]) => `\`<${el}>\` × ${n}`)
        .join(', ');
      lines.push(`| ${cell(file)} | ${cell(list)} |`);
    }
  }

  return `${lines.join('\n')}\n`;
}
