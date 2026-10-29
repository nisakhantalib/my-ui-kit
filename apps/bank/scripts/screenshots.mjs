// Captures the README / case-study screenshots from the built app.
//   npm run build -w bank && npm run preview -w bank   (in another terminal)
//   npm run screenshots -w bank          (OUT=dir to write somewhere else)
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:4174/';
const out = process.env.OUT ?? fileURLToPath(new URL('../../../docs/screenshots/', import.meta.url));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function open({
  theme = 'light',
  market = 'SG',
  hash = '',
  device = { viewport: { width: 1360, height: 900 } },
} = {}) {
  const context = await browser.newContext({ ...device, deviceScaleFactor: 2, colorScheme: theme });
  await context.addInitScript(
    ([t, m]) => {
      localStorage.setItem('theme', JSON.stringify(t));
      localStorage.setItem('market', JSON.stringify(m));
    },
    [theme, market],
  );
  const page = await context.newPage();
  await page.goto(base + hash);
  await page
    .getByRole('table')
    .first()
    .waitFor()
    .catch(() => {});
  await page.waitForTimeout(400);
  return page;
}

const shot = (page, name, opts = {}) => page.screenshot({ path: `${out}/${name}`, animations: 'disabled', ...opts });

let page = await open();
await shot(page, 'bank-overview-light.png', { fullPage: true });
await page.context().close();

page = await open({ theme: 'dark', market: 'HK' });
await shot(page, 'bank-overview-dark-hk.png', { fullPage: true });
await page.context().close();

// Transfer: payee search open, then the OTP dialog.
page = await open({ hash: '#/pay' });
await page.getByRole('combobox', { name: /Pay to/ }).fill('a');
await page.keyboard.press('ArrowDown');
await shot(page, 'bank-pay-combobox.png');
await page.keyboard.press('Enter');
await page.getByRole('textbox', { name: /Amount/ }).fill('250');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Confirm and send' }).click();
await page.getByRole('textbox', { name: 'One-time password' }).fill('123');
await shot(page, 'bank-pay-otp.png');
await page.context().close();

page = await open({ theme: 'dark', market: 'ID', hash: '#/pay', device: devices['Pixel 7'] });
await page.getByRole('combobox', { name: /Bayar ke/ }).fill('Budi');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.getByRole('textbox', { name: /Jumlah/ }).fill('750000');
await page.getByRole('button', { name: 'Lanjutkan' }).click();
await page.getByRole('button', { name: 'Konfirmasi dan kirim' }).click();
await page.getByRole('textbox', { name: 'Kode sekali pakai' }).fill('123456');
await page.getByRole('heading', { name: 'Transfer terkirim' }).waitFor();
await page.waitForTimeout(300);
await shot(page, 'bank-receipt-phone-dark-id.png');
await page.context().close();

await browser.close();
console.log(`Screenshots written to ${out}`);
