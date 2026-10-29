import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyTransform } from 'jscodeshift/src/testUtils.js';
import { afterAll, describe, expect, it } from 'vitest';
import * as transform from '../transforms/error-summary-focus-on-show.js';

const fixtures = fileURLToPath(new URL('../transforms/__testfixtures__/error-summary-focus-on-show/', import.meta.url));
const read = (/** @type {string} */ name) => readFileSync(join(fixtures, name), 'utf8');
const run = (/** @type {string} */ source) =>
  applyTransform(transform, {}, { source, path: 'fixture.tsx' }, { parser: transform.parser });

describe('error-summary-focus-on-show', () => {
  it.each(['basic', 'aliased'])('renames autoFocus on kit ErrorSummary (%s)', (name) => {
    expect(run(read(`${name}.input.tsx`))).toBe(read(`${name}.output.tsx`).trim());
  });

  it('leaves an ErrorSummary from another package alone', () => {
    const source = read('other-package.input.tsx');
    expect(run(source)).toBe(source.trim());
  });

  it('does not duplicate a prop that is already set', () => {
    const source = "import { ErrorSummary } from '@nisakhantalib/my-ui-kit';\n<ErrorSummary autoFocus focusOnShow />;";
    expect(run(source)).toBe(source);
  });

  it('ignores type-only imports', () => {
    const source = "import type { ErrorSummary } from '@nisakhantalib/my-ui-kit';\n<ErrorSummary autoFocus />;";
    expect(run(source)).toBe(source);
  });
});

// Spawns Node + jscodeshift (which loads Babel); a cold cache in CI can exceed the 5s default.
describe('my-ui-kit-codemod CLI', { timeout: 30_000 }, () => {
  const bin = fileURLToPath(new URL('../bin/my-ui-kit-codemod.js', import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), 'kit-codemod-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('rewrites files in place through jscodeshift', () => {
    const file = join(dir, 'Form.tsx');
    copyFileSync(join(fixtures, 'basic.input.tsx'), file);
    execFileSync(process.execPath, [bin, 'error-summary-focus-on-show', dir, '--silent'], { encoding: 'utf8' });
    expect(readFileSync(file, 'utf8')).toBe(read('basic.output.tsx'));
  });

  it('rejects an unknown transform and lists the real ones', () => {
    let stderr = '';
    try {
      execFileSync(process.execPath, [bin, 'nope', dir], { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      stderr = String(/** @type {{ stderr: string }} */ (error).stderr);
    }
    expect(stderr).toContain('Unknown transform "nope"');
    expect(stderr).toContain('error-summary-focus-on-show');
  });
});
