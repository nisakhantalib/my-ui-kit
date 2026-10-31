import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PAGES = ['', '#/activity', '#/pay', '#/cards', '#/settings'];

async function expectNoAxeViolations(page: Page) {
  // Finish entry animations first (fades change opacity, so contrast mid-fade is meaningless).
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

async function openBank(
  page: Page,
  { market = 'SG', hash = '', theme = 'light', tier = 'personal', signedIn = true } = {},
) {
  await page.clock.setFixedTime(new Date('2026-10-29T10:00:00')); // stable greeting and dates
  await page.addInitScript(
    ([m, th, ti, s]) => {
      localStorage.setItem('signed-in', JSON.stringify(s));
      localStorage.setItem('market', JSON.stringify(m));
      localStorage.setItem('theme', JSON.stringify(th));
      localStorage.setItem('tier', JSON.stringify(ti));
    },
    [market, theme, tier, signedIn] as const,
  );
  await page.goto(`/${hash}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Home simulates loading: wait until the accounts panel is no longer busy.
  if (!hash && signedIn)
    await expect(page.getByRole('region', { name: /^(Accounts|帳戶|Rekening)$/ })).not.toHaveAttribute(
      'aria-busy',
      'true',
    );
}

/** The visible main navigation: sidebar on desktop, bottom tab bar on phones. */
const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' }).filter({ visible: true });

async function payTanWeiLing(page: Page, amount: string) {
  const payTo = page.getByRole('combobox', { name: /Pay to/ });
  await payTo.fill('tan');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(payTo).toHaveValue('Tan Wei Ling');
  await page.getByRole('textbox', { name: /Amount/ }).fill(amount);
  await page.getByRole('button', { name: 'Continue' }).click();
}

test('every page passes WCAG 2.2 A/AA in light and dark', async ({ page }) => {
  test.slow(); // 5 pages × 2 themes, each with a full axe run
  for (const theme of ['light', 'dark']) {
    for (const hash of PAGES) {
      await openBank(page, { hash, theme });
      await expectNoAxeViolations(page);
    }
  }
});

test('Private tier and Traditional Chinese pass WCAG 2.2 A/AA too', async ({ page }) => {
  await openBank(page, { tier: 'private', theme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-brand', 'private');
  await expectNoAxeViolations(page);
  await openBank(page, { market: 'HK' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-HK');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('早安，嘉欣');
  await expectNoAxeViolations(page);
});

test('runs under a strict Content-Security-Policy with no violations, on every page', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { csp: string[] }).csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { csp: string[] }).csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("style-src 'self'");
  for (const hash of PAGES) {
    await openBank(page, { hash });
    expect(await page.evaluate(() => (window as unknown as { csp: string[] }).csp)).toEqual([]);
  }
});

test('navigation: focus moves to the new page heading and the title updates', async ({ page }) => {
  await openBank(page);
  await nav(page)
    .getByRole('link', { name: /Activity/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Activity' })).toBeFocused();
  await expect(page).toHaveTitle('Activity · Orchid Bank');
  await expect(nav(page).getByRole('link', { name: /Activity/ })).toHaveAttribute('aria-current', 'page');
});

test('transfer: payee by keyboard, review, OTP (wrong, then right), receipt, balance updated', async ({ page }) => {
  await openBank(page, { hash: '#/pay' });
  await payTanWeiLing(page, '1250.5');

  await expect(page.getByRole('heading', { name: 'Check before you send' })).toBeFocused();
  await expect(page.getByText('$1,250.50').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and send' }).click();

  const dialog = page.getByRole('dialog', { name: 'Approve this transfer' });
  const otp = dialog.getByRole('textbox', { name: 'One-time password' });
  await expect(otp).toBeFocused();
  await expect(otp).toHaveAttribute('autocomplete', 'one-time-code');
  await otp.fill('111111');
  await expect(otp).toHaveAccessibleDescription(/That code isn’t right/);
  await expectNoAxeViolations(page);

  await otp.fill('123456');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Transfer sent' })).toBeFocused();
  await expect(page.getByText('Completed')).toBeVisible();

  await page.getByRole('button', { name: 'Back to home' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const everyday = page.getByRole('listitem').filter({ hasText: 'Everyday Account' });
  await expect(everyday).toContainText('$11,230.05'); // 12,480.55 − 1,250.50
  await expect(page.getByRole('region', { name: 'Recent activity' })).toContainText('Tan Wei Ling');
});

test('validation: summary takes focus, links reach the fields, limits are enforced', async ({ page }) => {
  await openBank(page, { hash: '#/pay' });
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: /^There is a problem ?\(2 errors\)$/ })).toBeVisible();
  await expect(page.locator('.kit-error-summary')).toBeFocused();
  await page.getByRole('link', { name: 'Enter an amount' }).click();
  await expect(page.getByRole('textbox', { name: /Amount/ })).toBeFocused();

  await payTanWeiLing(page, '20000');
  await expect(page.getByRole('textbox', { name: /Amount/ })).toHaveAccessibleDescription(
    /more than your available balance of \$12,480\.55/,
  );
  await page.getByRole('textbox', { name: /Amount/ }).fill('6000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('textbox', { name: /Amount/ })).toHaveAccessibleDescription(
    /over your daily limit of \$5,000\.00/,
  );
});

test('upcoming bill deep-links into a prefilled payment; recent payees select with one tap', async ({ page }) => {
  await openBank(page);
  await page.getByRole('link', { name: 'Pay: SP Group' }).click();
  await expect(page.getByRole('combobox', { name: /Pay to/ })).toHaveValue('SP Group');
  await expect(page.getByRole('textbox', { name: /Amount/ })).toHaveValue('142.80');

  const lim = page.getByRole('button', { name: 'Lim Jia Hui', exact: true });
  await lim.click();
  await expect(lim).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', { name: /Pay to/ })).toHaveValue('Lim Jia Hui');
});

test('activity: search, money in/out filter, live count, CSV export', async ({ page }) => {
  await openBank(page, { hash: '#/activity' });
  await page.getByRole('searchbox', { name: /Search transactions/ }).fill('grab');
  await expect(page.getByRole('status').filter({ hasText: /^2 transactions$/ })).toBeAttached();
  await expect(page.getByRole('main')).not.toContainText('NTUC FairPrice');

  await page.getByRole('searchbox', { name: /Search transactions/ }).fill('');
  await page.getByRole('radio', { name: 'Money in' }).check();
  await expect(page.getByRole('radiogroup', { name: 'Show' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Salary · Acme Pte Ltd');
  await expect(page.getByRole('main')).not.toContainText('Grab');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csv = readFileSync(await (await download).path(), 'utf8');
  expect(csv).toContain('"Salary · Acme Pte Ltd","Income","Posted","5200.00"');

  await page.getByRole('button', { name: 'Table view' }).click();
  await expect(page.getByRole('table', { name: /Activity/ })).toBeVisible();
});

test('cards: freeze applies instantly; reporting lost asks first and blocks the card', async ({ page }) => {
  await openBank(page, { hash: '#/cards' });
  const freeze = page.getByRole('switch', { name: 'Freeze card' });
  await freeze.click();
  await expect(freeze).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('Card frozen');
  await expect(page.getByRole('switch', { name: 'Online payments' })).toBeDisabled();
  await freeze.click();

  await page.getByRole('button', { name: 'Report lost or stolen' }).click();
  const alert = page.getByRole('alertdialog', { name: 'Report this card lost or stolen?' });
  await expect(alert.getByRole('button', { name: 'Cancel' })).toBeFocused(); // the safe choice is the default
  await expectNoAxeViolations(page);
  await alert.getByRole('button', { name: 'Block card' }).click();
  await expect(page.getByRole('main').getByText('Blocked')).toBeVisible();
  await expect(freeze).toBeDisabled();
});

test('settings: theme and banking tier switch the whole app through tokens', async ({ page }) => {
  await openBank(page, { hash: '#/settings' });
  await page.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: /Private/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-brand', 'private');
  await expect(page.getByRole('main').getByText('Private client')).toBeVisible();
  await page.getByRole('radio', { name: /Indonesia/ }).check();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pengaturan');
});

test('markets: Indonesian rupiah has no decimals, Bahasa strings, local payment rail', async ({ page }) => {
  await openBank(page, { market: 'ID', hash: '#/pay' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'id-ID');
  await expect(page.getByText('Kirim uang seketika dengan BI-FAST.')).toBeVisible();
  const amount = page.getByRole('textbox', { name: /Jumlah/ });
  await expect(amount).toHaveAttribute('inputmode', 'numeric');
  await amount.fill('1500000');
  await amount.blur();
  await expect(amount).toHaveValue('1.500.000');
  await expect(amount).toHaveAccessibleDescription(/Mata uang: Rupiah Indonesia/);
});

test('hide balances: hidden on screen and for screen readers, remembered after reload', async ({ page }) => {
  await openBank(page);
  const hide = page.getByRole('button', { name: 'Hide balances' });
  await hide.click();
  await expect(hide).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: 'Total balance' })).toContainText('Hidden');
  await expect(page.getByText('$12,480.55')).toHaveCount(0);
  // The trend would give the figures away too.
  await expect(page.getByRole('slider', { name: 'Balance history' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Total balance' })).not.toContainText('%');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Hide balances' })).toHaveAttribute('aria-pressed', 'true');
});

test('sign-in: market chosen first, one button in, focus lands on the greeting; sign out returns', async ({ page }) => {
  await openBank(page, { signedIn: false });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to Orchid Bank');
  await expectNoAxeViolations(page);
  await page.getByRole('combobox', { name: 'Market' }).selectOption('HK');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('歡迎使用 Orchid Bank');
  await page.getByRole('button', { name: '查看示範帳戶' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '早安，嘉欣' })).toBeFocused();
  await page.goto('/#/settings');
  await page.getByRole('button', { name: '登出' }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: '查看示範帳戶' })).toBeVisible();
});

test('a ?demo link skips sign-in and leaves a clean URL', async ({ page }) => {
  await page.goto('/?demo#/cards');
  await expect(page.getByRole('heading', { level: 1, name: 'Cards' })).toBeVisible();
  expect(new URL(page.url()).search).toBe('');
});

test('balance chart: range switch, keyboard exploration announces date and balance, table alternative', async ({
  page,
}) => {
  await openBank(page);
  const chart = page.getByRole('slider', { name: 'Balance history' });
  await chart.focus();
  await expect(chart).toHaveAttribute('aria-valuetext', /^Thu, 29 Oct 2026: \$60,690\.55$/);
  await page.keyboard.press('ArrowLeft');
  await expect(chart).toHaveAttribute('aria-valuetext', /^Wed, 28 Oct 2026: /);
  await page.keyboard.press('Home');
  await expect(chart).toHaveAttribute('aria-valuetext', /^Wed, 30 Sept? 2026: /);
  await page.getByRole('radio', { name: '1W' }).check();
  await expect(chart).toHaveAttribute('aria-valuemax', '6');
  await page.getByRole('region', { name: 'Total balance' }).getByRole('button', { name: 'Show as table' }).click();
  await expect(page.getByRole('table', { name: 'Balance history' })).toBeVisible();
});

test('search: type, arrow, Enter opens the transaction in a side sheet; focus returns', async ({ page }) => {
  await openBank(page);
  await page.getByRole('button', { name: /^Search/ }).click();
  const box = page.getByRole('combobox', { name: 'Search Orchid Bank' });
  await expect(box).toBeFocused();
  await box.fill('fairprice');
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await expectNoAxeViolations(page);
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Transaction details' });
  await expect(sheet).toContainText('NTUC FairPrice');
  await expect(sheet).toContainText('Groceries');
  await expectNoAxeViolations(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /^Search/ })).toBeFocused();

  // Pages and actions work from the same box.
  await page.keyboard.press('Control+k');
  await box.fill('cards');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Cards' })).toBeVisible();
});

test('a recent transaction opens its details sheet from Home', async ({ page }) => {
  await openBank(page);
  await page.getByRole('region', { name: 'Recent activity' }).getByRole('button', { name: /Grab/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Transaction details' });
  await expect(sheet).toContainText('Pending transactions usually post');
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
});

test('account numbers are masked until asked for', async ({ page }) => {
  await openBank(page);
  const row = page.getByRole('listitem').filter({ hasText: 'Everyday Account' });
  await expect(row.getByText('account number ending 6789')).toBeAttached();
  const toggle = row.getByRole('button', { name: 'Show account number' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(row).toContainText('0123 4567 89');
});

test('reflows at 320px with no horizontal scrolling on every page (WCAG 1.4.10)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const hash of PAGES) {
    await openBank(page, { hash });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `page ${hash || 'home'}`).toBe(0);
  }
});

test('PWA: reloads and works offline once the service worker is installed', async ({ page, context }) => {
  await openBank(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the service worker take control
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Wei Ling');
  await context.setOffline(false);
});

test.describe('visual regression', () => {
  // Baselines are OS-specific (font rendering), so they are only kept for CI's Linux image.
  test.skip(process.platform !== 'linux', 'visual baselines are generated on Linux in CI');

  for (const theme of ['light', 'dark'] as const) {
    test(`home (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await openBank(page, { theme });
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`home-${theme}.png`, { fullPage: true });
    });
  }

  test('cards', async ({ page }) => {
    await openBank(page, { hash: '#/cards' });
    await expect(page).toHaveScreenshot('cards.png', { fullPage: true });
  });

  test('transfer review', async ({ page }) => {
    await openBank(page, { hash: '#/pay' });
    await payTanWeiLing(page, '250');
    await expect(page).toHaveScreenshot('transfer-review.png');
  });
});
