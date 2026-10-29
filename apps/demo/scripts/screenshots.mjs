// Regenerates the README screenshots from the built app.
//   npm run build && npm run preview -w demo   (in another terminal)
//   npm run screenshots -w demo
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:4173/';
const out = new URL('../../../docs/screenshots/', import.meta.url);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function open({ theme = 'light', hash = '', device = { viewport: { width: 1280, height: 800 } } } = {}) {
  const context = await browser.newContext({ ...device, deviceScaleFactor: 2, colorScheme: theme });
  // Skip the consent banner and seed one booking, so the screenshots show a used app.
  await context.addInitScript(
    ([t]) => {
      localStorage.setItem('analytics-consent', 'no');
      localStorage.setItem('theme', t);
      if (!localStorage.getItem('bookings'))
        localStorage.setItem(
          'bookings',
          JSON.stringify([
            {
              id: '1',
              name: 'Tan Wei Ling',
              nricMasked: '*****567D',
              clinic: 'Toa Payoh Health Hub',
              date: '2026-10-30',
              time: '1400',
            },
          ]),
        );
    },
    [theme],
  );
  const page = await context.newPage();
  await page.goto(base + hash);
  return page;
}

const shot = (page, name, opts = {}) =>
  page.screenshot({ path: fileURLToPath(new URL(name, out)), animations: 'disabled', ...opts });

// Booking flow, desktop light: step 2 after a failed Continue, so errors and radio cards show.
let page = await open();
await page.getByLabel('Full name').fill('Lim Jia Hui');
await page.getByLabel('NRIC / FIN').fill('S1234567D');
await page.getByLabel('Email').fill('jiahui@example.com');
await page.getByRole('button', { name: 'Continue' }).first().click();
await page.getByLabel('Appointment date').fill(tomorrow);
await page.getByRole('tabpanel').getByRole('button', { name: 'Continue' }).click();
await page.mouse.move(0, 0);
await shot(page, 'booking-desktop-light.png', { fullPage: true });
await page.context().close();

// Phone, dark: success toast after a booking.
page = await open({ theme: 'dark', device: devices['Pixel 7'] });
await page.getByLabel('Full name').fill('Lim Jia Hui');
await page.getByLabel('NRIC / FIN').fill('S1234567D');
await page.getByLabel('Email').fill('jiahui@example.com');
await page.getByRole('button', { name: 'Continue' }).first().click();
await page.getByRole('radio', { name: 'Tampines Family Clinic' }).check();
await page.getByLabel('Appointment date').fill(tomorrow);
await page.getByRole('combobox', { name: /Time slot/ }).selectOption({ label: '9:30 am' });
await page.getByRole('tabpanel').getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Confirm booking' }).click();
await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
await page.getByRole('region', { name: 'Notifications' }).getByText('Booking confirmed').waitFor();
await page.evaluate(() => window.scrollTo(0, 0));
await shot(page, 'booking-phone-dark.png');
await page.context().close();

// Component gallery, both themes.
for (const theme of ['light', 'dark']) {
  page = await open({ theme, hash: '#/components' });
  await page.getByRole('row').filter({ hasText: '--kit-focus' }).waitFor();
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // a nav link shows the focus ring
  await shot(page, `gallery-${theme}.png`, { fullPage: true });
  await page.context().close();
}

await browser.close();
console.log('Screenshots written to docs/screenshots/');
