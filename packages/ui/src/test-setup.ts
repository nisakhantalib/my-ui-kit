import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import axe from 'axe-core';

afterEach(() => cleanup());

/**
 * Runs axe-core against rendered markup and fails with readable output.
 * color-contrast is skipped because jsdom has no layout engine; contrast is
 * checked on the real page in CI instead (see README).
 */
export async function expectNoA11yViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} node/s)`);
  expect(summary).toEqual([]);
}
