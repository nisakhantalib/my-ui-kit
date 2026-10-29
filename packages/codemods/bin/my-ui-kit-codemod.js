#!/usr/bin/env node
// Thin wrapper over jscodeshift so consumers run one documented command per migration,
// with the parser and ignore list already right for a TSX app.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { run } from 'jscodeshift/src/Runner.js';

const transformsDir = fileURLToPath(new URL('../transforms/', import.meta.url));
const transforms = readdirSync(transformsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => f.slice(0, -3));

const usage = `Usage: my-ui-kit-codemod <transform> <paths...> [--dry] [--print] [--silent]

Transforms:
${transforms.map((t) => `  ${t}`).join('\n')}

  --dry     report what would change, write nothing
  --print   print transformed files to stdout
  --silent  no progress output`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    dry: { type: 'boolean', default: false },
    print: { type: 'boolean', default: false },
    silent: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const [name, ...paths] = positionals;
if (values.help || !name) {
  console.log(usage);
  process.exit(name || values.help ? 0 : 1);
}
if (!transforms.includes(name)) {
  console.error(`Unknown transform "${name}".\n\n${usage}`);
  process.exit(1);
}
if (paths.length === 0) {
  console.error(`No paths given.\n\n${usage}`);
  process.exit(1);
}

const result = await run(join(transformsDir, `${name}.js`), paths, {
  parser: 'tsx',
  extensions: 'tsx,ts,jsx,js',
  ignorePattern: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**'],
  dry: values.dry,
  print: values.print,
  silent: values.silent,
  verbose: values.silent ? 0 : 1,
  // In-process keeps the CLI fast for one app and avoids worker start-up on Windows.
  runInBand: true,
  babel: false,
});

if (result.error > 0) process.exit(1);
