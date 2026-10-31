// Runs axe-core (WCAG 2.2 A/AA, including colour contrast) on every story of the built
// Storybook, for every brand in light and dark, in real Chromium. New stories are covered automatically.
//   npm run build:storybook && npm run test:storybook
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../storybook-static/', import.meta.url));
const axeSource = await readFile(fileURLToPath(import.meta.resolve('axe-core/axe.min.js')), 'utf8');
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

// Minimal static server for storybook-static/ (no extra dependency).
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  try {
    const body = await readFile(join(root, path || 'index.html'));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;

const index = JSON.parse(await readFile(join(root, 'index.json'), 'utf8'));
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
const failures = [];

const BRANDS = ['civic', 'orchid', 'private'];
const combos = BRANDS.flatMap((brand) => ['light', 'dark'].map((theme) => ({ brand, theme })));

for (const story of stories) {
  for (const { brand, theme } of combos) {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};brand:${brand}`);
    await page.waitForSelector('#storybook-root > *', { timeout: 15_000 });
    // Let entry animations settle; looping ones (spinners) never finish, so skip those.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished),
      ),
    );
    // Storybook's a11y addon may already have loaded axe and be mid-run; reuse it and wait.
    if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      for (;;) {
        try {
          const { violations } = await window.axe.run('#storybook-root', {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
          });
          return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        } catch (err) {
          if (!String(err).includes('already running')) throw err;
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    });
    const label = `${story.title} › ${story.name} (${brand}, ${theme})`;
    if (violations.length) failures.push(`${label}\n    ${violations.join('\n    ')}`);
    else console.log(`  ✓ ${label}`);
  }
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n✗ ${failures.length} story/theme combinations have violations:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`\n${stories.length} stories × ${BRANDS.length} brands × 2 themes pass WCAG 2.2 A/AA.`);
