import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.js';

/** Custom elements render asynchronously (React root), so wait for the inner control. */
async function mount(html: string) {
  document.body.innerHTML = html;
  await new Promise((r) => setTimeout(r, 50));
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
});

describe('kit-* custom elements (real Chromium)', () => {
  it('kit-amount-input: labelled control, emits minor units as a DOM event', async () => {
    await mount('<kit-amount-input label="Amount" hint="Daily limit"></kit-amount-input>');
    const values: (number | null)[] = [];
    document.querySelector('kit-amount-input')!.addEventListener('kit-change', (e) => {
      values.push((e as CustomEvent<{ value: number | null }>).detail.value);
    });
    const input = page.getByRole('textbox', { name: 'Amount' });
    await expect.element(input).toHaveAccessibleDescription('Currency: Singapore Dollar Daily limit');
    await userEvent.type(input, '19.99');
    expect(values.at(-1)).toBe(1999);
  });

  it('attributes are live: setting error re-renders and marks the field invalid', async () => {
    await mount('<kit-amount-input label="Amount"></kit-amount-input>');
    document.querySelector('kit-amount-input')!.setAttribute('error', 'Enter an amount');
    await expect.element(page.getByRole('textbox', { name: 'Amount' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('locale and currency come from the page: lang + data-currency', async () => {
    document.documentElement.lang = 'id-ID';
    await mount('<div data-currency="IDR"><kit-amount-input label="Jumlah"></kit-amount-input></div>');
    await expect.element(page.getByRole('textbox', { name: 'Jumlah' })).toHaveAttribute('inputmode', 'numeric');
  });

  it('kit-button and kit-alert keep their text content', async () => {
    await mount(
      '<kit-button variant="secondary">Continue</kit-button><kit-alert tone="warning" heading="Heads up">Body text</kit-alert>',
    );
    await expect.element(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect.element(page.getByText('Warning: Heads up')).toBeInTheDocument();
    await expect.element(page.getByText('Body text')).toBeVisible();
  });

  it('kit-switch toggles and reports its state', async () => {
    await mount('<kit-switch label="SMS alerts"></kit-switch>');
    let last: boolean | undefined;
    document
      .querySelector('kit-switch')!
      .addEventListener('kit-change', (e) => (last = (e as CustomEvent<{ value: boolean }>).detail.value));
    await page.getByRole('switch', { name: 'SMS alerts' }).click();
    expect(last).toBe(true);
  });

  it('kit-otp-input fires kit-complete with the code', async () => {
    await mount('<kit-otp-input label="Code"></kit-otp-input>');
    let code = '';
    document
      .querySelector('kit-otp-input')!
      .addEventListener('kit-complete', (e) => (code = (e as CustomEvent<{ value: string }>).detail.value));
    await userEvent.type(page.getByRole('textbox', { name: 'Code' }), '246810');
    expect(code).toBe('246810');
  });
});
