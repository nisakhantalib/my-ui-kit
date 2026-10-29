// ErrorSummary `autoFocus` -> `focusOnShow` (deprecated in 0.2.0, removed in 1.0.0).
// The rename is scoped to ErrorSummary imported from the kit (aliases and namespace imports
// too) because `autoFocus` is a valid, unrelated prop on TextField and on DOM elements.
const KIT_PACKAGE = '@nisakhantalib/my-ui-kit';
const COMPONENT = 'ErrorSummary';
const FROM = 'autoFocus';
const TO = 'focusOnShow';

export const parser = 'tsx';

/** @type {import('jscodeshift').Transform} */
export default function transform(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  /** @type {Set<string>} */
  const locals = new Set();
  /** @type {Set<string>} */
  const namespaces = new Set();
  root.find(j.ImportDeclaration, { source: { value: KIT_PACKAGE } }).forEach((path) => {
    if (path.node.importKind === 'type') return;
    for (const spec of path.node.specifiers ?? []) {
      if (spec.type === 'ImportSpecifier' && spec.imported.name === COMPONENT && spec.importKind !== 'type') {
        locals.add(spec.local?.name ?? COMPONENT);
      } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local) {
        namespaces.add(String(spec.local.name));
      }
    }
  });
  if (locals.size === 0 && namespaces.size === 0) return file.source;

  /** @param {any} name */
  const isErrorSummary = (name) =>
    (name.type === 'JSXIdentifier' && locals.has(name.name)) ||
    (name.type === 'JSXMemberExpression' &&
      name.object.type === 'JSXIdentifier' &&
      namespaces.has(name.object.name) &&
      name.property.name === COMPONENT);

  let changed = false;
  root.find(j.JSXOpeningElement).forEach((path) => {
    if (!isErrorSummary(path.node.name)) return;
    const attrs = path.node.attributes ?? [];
    const named = (/** @type {string} */ n) =>
      attrs.find((a) => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === n);
    const from = named(FROM);
    // If both are set the intent is ambiguous; leave it for the lint rule to flag to a human.
    if (!from || named(TO) || from.type !== 'JSXAttribute') return;
    from.name = j.jsxIdentifier(TO);
    changed = true;
  });

  // recast defaults to os.EOL, which would turn every line of an LF file into a diff on Windows.
  return changed ? root.toSource({ lineTerminator: file.source.includes('\r\n') ? '\r\n' : '\n' }) : file.source;
}
