// tsc keeps `import './styles.css'` in index.d.ts, but the CSS ships at dist/my-ui-kit.css,
// not next to the types. Consumers import it explicitly ('@nisakhantalib/my-ui-kit/styles.css'),
// so the line is removed from the published types.
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../dist/types/index.d.ts', import.meta.url);
const before = readFileSync(file, 'utf8');
const after = before.replace(/^import '\.\/styles\.css';\r?\n/m, '');
if (after === before) throw new Error('Expected a styles.css import in index.d.ts — did the entry change?');
writeFileSync(file, after);
