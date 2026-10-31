// Captures the README / case-study screenshots from the built app.
//   npm run build -w bank && npm run preview -w bank   (in another terminal)
//   npm run screenshots -w bank          (OUT=dir to write somewhere else)
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:4174/';
const out = process.env.OUT ?? fileURLToPath(new URL('../../../docs/screenshots/', import.meta.url));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const DESKTOP = { viewport: { width: 1440, height: 1000 } };

async function open({ hash = '', theme = 'light', market = 'SG', tier = 'personal', device = DESKTOP } = {}) {
  const context = await browser.newContext({ ...device, deviceScaleFactor: 2, colorScheme: theme });
  await context.addInitScript(
    ([t, m, ti]) => {
      localStorage.setItem('theme', JSON.stringify(t));
      localStorage.setItem('market', JSON.stringify(m));
      localStorage.setItem('tier', JSON.stringify(ti));
    },
    [theme, market, tier],
  );
  const page = await context.newPage();
  await page.goto(base + hash);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForTimeout(1200); // loading state + fade-in
  return page;
}

const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: `${out}/${name}`, animations: 'disabled', ...opts });
  await page.context().close();
};

await shot(await open(), 'home-light.png');
await shot(await open({ theme: 'dark' }), 'home-dark.png');
await shot(await open({ tier: 'private' }), 'home-private.png');
await shot(await open({ hash: '#/activity' }), 'activity.png');
await shot(await open({ hash: '#/cards', theme: 'dark' }), 'cards-dark.png');

// Transfer: approve dialog with a partly typed code.
let page = await open({ hash: '#/pay' });
await page.getByRole('button', { name: 'Tan Wei Ling', exact: true }).click();
await page.getByRole('textbox', { name: /Amount/ }).fill('250');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Confirm and send' }).click();
await page.getByRole('textbox', { name: 'One-time password' }).fill('123');
await page.waitForTimeout(400);
await shot(page, 'pay-otp.png');

// Phones: Hong Kong home (Traditional Chinese, dark) and an Indonesian receipt.
await shot(await open({ market: 'HK', theme: 'dark', device: devices['Pixel 7'] }), 'phone-home-hk-dark.png');
page = await open({ market: 'ID', hash: '#/pay', device: devices['Pixel 7'] });
await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
await page.getByRole('textbox', { name: /Jumlah/ }).fill('750000');
await page.getByRole('button', { name: 'Lanjutkan' }).click();
await page.getByRole('button', { name: 'Konfirmasi dan kirim' }).click();
await page.getByRole('textbox', { name: 'Kode sekali pakai' }).fill('123456');
await page.getByRole('heading', { name: 'Transfer terkirim' }).waitFor();
await page.waitForTimeout(500);
await shot(page, 'phone-receipt-id.png');

await browser.close();
console.log(`Screenshots written to ${out}`);
