import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

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

/** Records Content-Security-Policy violations in the page, so a test can assert there were none. */
async function trackCsp(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { cspViolations: string[] }).cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { cspViolations: string[] }).cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
}
const cspViolations = (page: Page) =>
  page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations);

async function openBank(page: Page, { market = 'SG', hash = '' } = {}) {
  await page.clock.setFixedTime(new Date('2026-10-29T10:00:00')); // stable greeting and dates
  await page.addInitScript((m) => localStorage.setItem('market', JSON.stringify(m)), market);
  await page.goto(`/${hash}`);
  if (!hash)
    await expect(page.getByRole('table', { name: /Recent transactions|最近交易|Transaksi terbaru/ })).toBeVisible();
}

async function payTanWeiLing(page: Page, amount: string) {
  const payTo = page.getByRole('combobox', { name: /Pay to/ });
  await payTo.fill('tan');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(payTo).toHaveValue('Tan Wei Ling');
  await page.getByRole('textbox', { name: /Amount/ }).fill(amount);
  await page.getByRole('button', { name: 'Continue' }).click();
}

test('overview passes WCAG 2.2 A/AA in light and dark, and in Traditional Chinese', async ({ page }) => {
  await openBank(page);
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoAxeViolations(page);

  await page.getByRole('combobox', { name: 'Market' }).selectOption('HK');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-HK');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('早安，嘉欣');
  await expect(page.getByRole('table', { name: /最近交易/ })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('runs under a strict Content-Security-Policy with no violations', async ({ page }) => {
  await trackCsp(page);
  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("style-src 'self'");
  await openBank(page);
  await page.getByRole('button', { name: 'Show as table' }).click();
  await page.getByRole('link', { name: 'Pay & transfer' }).first().click();
  await payTanWeiLing(page, '10');
  expect(await cspViolations(page)).toEqual([]);
});

test('transfer: payee by keyboard, amount, review, OTP (wrong, then right), receipt, balance updated', async ({
  page,
}) => {
  await openBank(page, { hash: '#/pay' });
  await payTanWeiLing(page, '1250.5');

  await expect(page.getByRole('heading', { name: 'Check before you send' })).toBeFocused();
  await expect(page.getByText('$1,250.50').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and send' }).click();

  const dialog = page.getByRole('dialog', { name: 'Approve this transfer' });
  await expect(dialog).toBeVisible();
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

  await page.getByRole('button', { name: 'Back to overview' }).click();
  // Route change moves focus to the new page's heading.
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const everyday = page.getByRole('listitem').filter({ hasText: 'Everyday Account' });
  await expect(everyday).toContainText('$11,230.05'); // 12,480.55 − 1,250.50
  await expect(page.getByRole('row').filter({ hasText: 'Tan Wei Ling' })).toContainText('-$1,250.50');
});

test('validation: summary takes focus, links reach the fields, limits are enforced', async ({ page }) => {
  await openBank(page, { hash: '#/pay' });
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'There is a problem (2 errors)' })).toBeVisible();
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
  await expectNoAxeViolations(page);
});

test('hide balances: masked on screen and for screen readers, remembered after reload', async ({ page }) => {
  await openBank(page);
  const hide = page.getByRole('switch', { name: 'Hide balances' });
  await hide.click();
  await expect(hide).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('region', { name: 'Total balance' })).toContainText('Hidden');
  await expect(page.getByText('$12,480.55')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Hide balances' })).toHaveAttribute('aria-checked', 'true');
});

test('account numbers are masked until asked for', async ({ page }) => {
  await openBank(page);
  const card = page.getByRole('listitem').filter({ hasText: 'Everyday Account' });
  await expect(card.getByText('account number ending 6789')).toBeAttached();
  const toggle = card.getByRole('button', { name: 'Show account number' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(card).toContainText('0123 4567 89');
});

test('reflows at 320px with no horizontal scrolling (WCAG 1.4.10)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const hash of ['', '#/pay']) {
    await openBank(page, { hash });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `page ${hash || 'overview'}`).toBe(0);
  }
});

test.describe('visual regression', () => {
  // Baselines are OS-specific (font rendering), so they are only kept for CI's Linux image.
  test.skip(process.platform !== 'linux', 'visual baselines are generated on Linux in CI');

  for (const theme of ['light', 'dark'] as const) {
    test(`overview (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem('theme', JSON.stringify(t)), theme);
      await openBank(page);
      await expect(page).toHaveScreenshot(`overview-${theme}.png`, { fullPage: true });
    });
  }

  test('transfer review', async ({ page }) => {
    await openBank(page, { hash: '#/pay' });
    await payTanWeiLing(page, '250');
    await expect(page).toHaveScreenshot('transfer-review.png');
  });
});
