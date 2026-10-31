import { useKit } from '../i18n.js';
import { cx } from '../utils.js';

export interface MoneyProps {
  /** Minor units (cents): 123450 = 1,234.50. */
  value: number;
  /** ISO 4217 code. Defaults to the KitProvider currency. */
  currency?: string;
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
  /** 'symbol' ($1,234.50), 'code' (SGD 1,234.50) or 'none' (1,234.50). */
  display?: 'symbol' | 'code' | 'none';
  /** Show the minor part (cents) smaller and raised, as banking dashboards do. Default true. */
  emphasiseMajor?: boolean;
  className?: string;
}

/**
 * A formatted amount for the market's locale, with the cents de-emphasised so the figure that
 * matters reads first. It is one run of text, so screen readers hear the full amount normally;
 * the styling is visual only.
 */
export function Money({
  value,
  currency,
  signDisplay,
  display = 'symbol',
  emphasiseMajor = true,
  className,
}: MoneyProps) {
  const kit = useKit();
  const cur = currency ?? kit.currency;
  const digits = kit.currencyDigits(cur);
  const parts = new Intl.NumberFormat(kit.locale, {
    ...(display === 'none'
      ? { minimumFractionDigits: digits, maximumFractionDigits: digits }
      : { style: 'currency', currency: cur, currencyDisplay: display }),
    signDisplay,
  }).formatToParts(value / 10 ** digits);

  return (
    <span className={cx('kit-money', className)}>
      {parts.map((p, i) =>
        emphasiseMajor && (p.type === 'decimal' || p.type === 'fraction') ? (
          <span key={i} className="kit-money__minor">
            {p.value}
          </span>
        ) : (
          p.value
        ),
      )}
    </span>
  );
}
