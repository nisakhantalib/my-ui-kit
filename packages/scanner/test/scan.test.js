import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { scan, scanSource, toMarkdown } from '../src/scan.js';

const fixtures = fileURLToPath(new URL('./__fixtures__/', import.meta.url));
const now = new Date('2026-01-01T00:00:00Z');
const report = scan([join(fixtures, 'app')], { root: fixtures, now });

describe('scan', () => {
  it('summarises adoption across the fixture app', () => {
    expect(report.summary).toEqual({
      filesScanned: 4,
      filesImportingKit: 2,
      componentsUsed: 4,
      jsxUsages: 7,
      deprecatedUsages: 1,
      rawElementsInKitFiles: 4,
    });
    expect(report.roots).toEqual(['app']);
    expect(report.generatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('counts usages and props per component, most used first', () => {
    expect(Object.keys(report.components)).toEqual(['Button', 'TextField', 'Dialog', 'ErrorSummary']);
    expect(report.components.Button).toEqual({
      files: 2,
      usages: 3,
      props: { '{...spread}': 1, variant: 1 },
      byFile: { 'app/src/Form.tsx': 2, 'app/src/Namespace.jsx': 1 },
    });
    expect(report.components.TextField?.props).toEqual({ label: 2, hint: 1, required: 1, type: 1 });
  });

  it('resolves aliased imports and reports deprecated props with a location', () => {
    expect(report.deprecatedUsages).toEqual([
      {
        file: 'app/src/Form.tsx',
        line: 7,
        column: 28,
        component: 'ErrorSummary',
        prop: 'autoFocus',
        replacement: 'focusOnShow',
        deprecatedIn: '0.2.0',
        removedIn: '1.0.0',
        codemod: 'error-summary-focus-on-show',
      },
    ]);
  });

  it('counts raw controls only in files that import the kit', () => {
    expect(report.adoptionGaps).toEqual({
      totals: { button: 1, 'input[type=checkbox]': 1, 'input[type=text]': 1, select: 1 },
      byFile: {
        'app/src/Form.tsx': { button: 1, 'input[type=checkbox]': 1, 'input[type=text]': 1 },
        'app/src/Namespace.jsx': { select: 1 },
      },
    });
    expect(report.files.map((f) => f.file)).toEqual(['app/src/Form.tsx', 'app/src/Namespace.jsx']);
  });

  it('reads the kit version from every package.json that depends on it', () => {
    expect(report.packages).toEqual([
      { path: 'app/package.json', name: 'fixture-app', kitVersion: '^0.1.0', dependencyType: 'dependencies' },
      {
        path: 'app/packages/widgets/package.json',
        name: '@fixture/widgets',
        kitVersion: '>=0.1.0',
        dependencyType: 'peerDependencies',
      },
    ]);
  });

  it('ignores type-only imports and non-kit packages', () => {
    const result = scanSource(
      'x.tsx',
      "import type { Button } from '@nisakhantalib/my-ui-kit';\nimport { Select } from 'other';\n<><Button /><Select /></>;",
    );
    expect(result.importsKit).toBe(true);
    expect(result.usages).toEqual({});
  });

  it('skips build output and dependencies', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kit-scan-'));
    try {
      const code = "import { Button } from '@nisakhantalib/my-ui-kit';\nexport const B = () => <Button />;\n";
      for (const skipped of [
        'node_modules/pkg',
        'dist',
        'build',
        'coverage',
        'android/app',
        'ios',
        'storybook-static',
      ]) {
        mkdirSync(join(dir, skipped), { recursive: true });
        writeFileSync(join(dir, skipped, 'index.jsx'), code);
      }
      writeFileSync(join(dir, 'index.d.ts'), 'export {};\n');
      writeFileSync(join(dir, 'App.jsx'), code);
      expect(scan([dir], { root: dir }).summary).toMatchObject({ filesScanned: 1, jsxUsages: 1 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('toMarkdown', () => {
  it('renders the report as tables', () => {
    expect(toMarkdown(report)).toMatchSnapshot();
  });
});

// Spawns Node; a cold cache in CI can exceed the 5s default.
describe('kit-scan CLI', { timeout: 30_000 }, () => {
  const bin = fileURLToPath(new URL('../bin/kit-scan.js', import.meta.url));
  const out = mkdtempSync(join(tmpdir(), 'kit-scan-cli-'));
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('writes JSON and Markdown reports', () => {
    const json = join(out, 'nested', 'report.json');
    const md = join(out, 'report.md');
    execFileSync(process.execPath, [bin, 'app', '--json', json, '--markdown', md], { cwd: fixtures, stdio: 'pipe' });
    const written = JSON.parse(readFileSync(json, 'utf8'));
    expect(written.schemaVersion).toBe(1);
    expect(written.summary).toEqual(report.summary);
    expect(readFileSync(md, 'utf8')).toContain('| ErrorSummary | 1 | 1 |');
  });

  it('fails the build on deprecated usages when asked', () => {
    expect(() =>
      execFileSync(process.execPath, [bin, 'app', '--json', join(out, 'r.json'), '--fail-on-deprecated'], {
        cwd: fixtures,
        stdio: 'pipe',
      }),
    ).toThrow();
  });
});
