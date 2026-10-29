// Resolves JSX element names back to the kit export they came from, so rules only judge
// real kit components: `<Summary>` after `import { ErrorSummary as Summary }` counts, a local
// `ErrorSummary` from another package does not.
export const KIT_PACKAGE = '@nisakhantalib/my-ui-kit';

/** Tracks kit imports in one file. Call `onImport` for every ImportDeclaration. */
export function createKitImports() {
  /** @type {Map<string, string>} local name -> exported name */
  const named = new Map();
  /** @type {Set<string>} `import * as Kit` locals */
  const namespaces = new Set();
  let importsKit = false;

  return {
    get importsKit() {
      return importsKit;
    },
    /** @param {any} node ImportDeclaration */
    onImport(node) {
      if (node.source.value !== KIT_PACKAGE) return;
      importsKit = true;
      if (node.importKind === 'type') return;
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier' && spec.importKind !== 'type') {
          const imported = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
          named.set(spec.local.name, imported);
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          namespaces.add(spec.local.name);
        }
      }
    },
    /**
     * @param {any} name JSXOpeningElement name
     * @returns {string | undefined} the kit export name, if the element is a kit component
     */
    resolve(name) {
      if (name.type === 'JSXIdentifier') return named.get(name.name);
      if (
        name.type === 'JSXMemberExpression' &&
        name.object.type === 'JSXIdentifier' &&
        namespaces.has(name.object.name)
      ) {
        return name.property.name;
      }
      return undefined;
    },
  };
}
