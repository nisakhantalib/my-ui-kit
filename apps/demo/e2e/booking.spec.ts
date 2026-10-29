import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Allow' }).click(); // analytics consent banner
});

test('passes WCAG 2.2 A/AA automated checks in light and dark mode', async ({ page }) => {
  await expectNoAxeViolations(page);
  const toggle = page.getByRole('button', { name: 'Dark mode' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoAxeViolations(page);
});

test('component gallery: every state passes axe in both themes, contrast table is measured live', async ({ page }) => {
  await page.getByRole('link', { name: 'Components' }).click();
  await expect(page.getByRole('link', { name: 'Components' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Components');
  await expectNoAxeViolations(page);

  const primaryRow = page.getByRole('row').filter({ hasText: '--kit-primary' });
  await expect(primaryRow).toContainText('meets 4.5:1');
  const lightRatio = await primaryRow.getByRole('cell').last().innerText();

  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expectNoAxeViolations(page);
  await expect(primaryRow).toContainText('meets 4.5:1');
  await expect(primaryRow.getByRole('cell').last()).not.toHaveText(lightRatio); // recomputed for the dark palette

  await page.getByRole('button', { name: 'Open alert dialog' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Delete this booking?' })).toBeVisible();
  // Wait for the dialog's open animation (finite ones only: the loading spinner loops forever).
  await page.evaluate(() =>
    Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)),
  );
  await expectNoAxeViolations(page);
});

test('reflows with no horizontal scrolling at 320px wide (WCAG 1.4.10)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('keyboard user: skip link first, then errors move focus and are announced', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();

  await page.getByRole('button', { name: 'Continue' }).first().click();
  await expect(page.getByLabel('Full name')).toBeFocused();
  await expect(page.getByRole('alert')).toHaveText('3 errors on this step. Enter your full name.');
  await expect(page.getByLabel('NRIC / FIN')).toHaveAttribute('aria-invalid', 'true');
});

test('completes a booking and stores only a masked NRIC', async ({ page }) => {
  await page.getByLabel('Full name').fill('Tan Wei Ling');
  await page.getByLabel('NRIC / FIN').fill('S1234567D');
  await page.getByLabel('Email').fill('weiling@example.com');
  await page.getByRole('button', { name: 'Continue' }).first().click();

  await expect(page.getByRole('tab', { selected: true })).toHaveText('2. Clinic & date');
  await page.getByLabel('Toa Payoh Health Hub').check();
  await page.getByLabel('Appointment date').fill(tomorrow);
  await page.getByRole('tabpanel').getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('button', { name: 'Confirm booking' }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirm this booking?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Confirm' })).toBeFocused();
  await expectNoAxeViolations(page);

  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Booking confirmed' })).toHaveText(
    `Booking confirmed at Toa Payoh Health Hub on ${tomorrow}.`,
  );
  const mine = page.getByRole('complementary');
  await expect(mine).toContainText('*****567D');
  await expect(mine).not.toContainText('S1234567D');
});

test('PWA: reloads and works offline once the service worker is installed', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the service worker take control of the page
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clinic appointments');
  await expect(page.getByText('Offline — bookings saved on this device')).toBeVisible();
  await context.setOffline(false);
});
