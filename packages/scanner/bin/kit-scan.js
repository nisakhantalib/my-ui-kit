#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { scan, toMarkdown } from '../src/scan.js';

const usage = `Usage: kit-scan <dir...> [--json out.json] [--markdown out.md] [--root dir] [--fail-on-deprecated]

  --json <file>          write the JSON report (schema: see the package README)
  --markdown <file>      write a Markdown summary
  --root <dir>           make report paths relative to this directory (default: cwd)
  --fail-on-deprecated   exit 1 if any deprecated prop is used (a CI gate before a major)`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    json: { type: 'string' },
    markdown: { type: 'string' },
    root: { type: 'string' },
    'fail-on-deprecated': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help || positionals.length === 0) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}

const report = scan(positionals, { root: resolve(values.root ?? '.') });

/** @param {string} file @param {string} content */
const write = (file, content) => {
  mkdirSync(dirname(resolve(file)), { recursive: true });
  writeFileSync(file, content);
  console.log(`Wrote ${file}`);
};
if (values.json) write(values.json, `${JSON.stringify(report, null, 2)}\n`);
if (values.markdown) write(values.markdown, toMarkdown(report));
if (!values.json && !values.markdown) process.stdout.write(toMarkdown(report));

const { summary } = report;
console.error(
  `kit-scan: ${summary.filesImportingKit}/${summary.filesScanned} files use the kit, ${summary.jsxUsages} usages of ${summary.componentsUsed} components, ` +
    `${summary.deprecatedUsages} deprecated, ${summary.rawElementsInKitFiles} raw controls in kit files`,
);
if (values['fail-on-deprecated'] && summary.deprecatedUsages > 0) process.exit(1);
