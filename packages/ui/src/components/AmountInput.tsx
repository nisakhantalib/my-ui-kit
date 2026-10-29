import { forwardRef, useEffect, useState, type FocusEvent, type InputHTMLAttributes } from 'react';
import { cx, useFieldIds } from '../utils.js';
import { useKit, type KitContextValue } from '../i18n.js';
import { FieldError, FieldHint, RequiredMark } from './Field.js';

export interface AmountInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type' | 'value' | 'defaultValue' | 'onChange'
> {
  label: string;
  hint?: string;
  error?: string;
  /** ISO 4217 code. Defaults to the KitProvider currency. */
  currency?: string;
  /** Amount in minor units (cents): 123450 = 1,234.50 SGD. `null` = empty or not a valid amount. */
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (minor: number | null) => void;
  id?: string;
}

/** Grouped for reading ("1,234.50"), or ungrouped for editing so the caret doesn't jump ("1234.50"). */
function toText(kit: KitContextValue, minor: number | null, currency: string, editing: boolean) {
  if (minor === null) return '';
  const grouped = kit.formatMoney(minor, { currency, display: 'none' });
  return editing ? grouped.replaceAll(kit.separators.group, '') : grouped;
}

/**
 * Money input. Values are integers in minor units, never floats, so 0.1 + 0.2 bugs can't reach a
 * payment. A text input, not type="number": number inputs accept "1e5", drop grouping, change on
 * scroll, and are read inconsistently by screen readers.
 *
 * - Shows grouped digits for the locale when not editing (1,234.50 / 1.234,50) and plain digits while editing
 * - The currency is shown beside the field and spoken as its description ("Currency: Singapore Dollar")
 * - Too many decimals or stray characters show a built-in error unless you pass your own
 */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  {
    label,
    hint,
    error,
    currency: currencyProp,
    value,
    defaultValue = null,
    onValueChange,
    required,
    id,
    className,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const kit = useKit();
  const currency = currencyProp ?? kit.currency;
  const digits = kit.currencyDigits(currency);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<number | null>(defaultValue);
  const current = controlled ? value : internal;

  const [text, setText] = useState(() => toText(kit, current, currency, false));
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);

  // Follow outside changes to a controlled value (e.g. "Pay full balance"), unless the user is typing.
  useEffect(() => {
    if (!focused) setText(toText(kit, current, currency, false));
  }, [current, focused, kit, currency]);

  function commit(next: number | null) {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  }

  function handleChange(raw: string) {
    setText(raw);
    if (raw.trim() === '') {
      setInvalid(false);
      commit(null);
      return;
    }
    const parsed = kit.parseMoney(raw, currency);
    setInvalid(parsed === null);
    commit(parsed);
  }

  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!(error || invalid));
  const currencyId = `${inputId}-currency`;
  const example = kit.formatMoney(1234 * 10 ** digits + (digits ? 5 * 10 ** (digits - 1) : 0), {
    currency,
    display: 'none',
  });
  const shownError = error || (invalid ? kit.t('amount.invalid', { example }) : undefined);

  return (
    <div className={cx('kit-field', shownError && 'kit-field--error', className)}>
      <label className="kit-field__label" htmlFor={inputId}>
        {label}
        <RequiredMark show={required} />
      </label>
      <FieldHint id={hintId}>{hint}</FieldHint>
      <div className="kit-amount">
        <span className="kit-amount__currency" aria-hidden="true">
          {currency}
        </span>
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode={digits > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          className="kit-field__input kit-amount__input"
          value={text}
          required={required}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={[currencyId, describedBy].filter(Boolean).join(' ')}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={(e: FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            if (!invalid) setText(toText(kit, current, currency, true));
            onFocus?.(e);
          }}
          onBlur={(e: FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            if (!invalid) setText(toText(kit, current, currency, false));
            onBlur?.(e);
          }}
          {...rest}
        />
        <span id={currencyId} className="kit-sr-only">
          {kit.t('amount.currency', { currency: kit.currencyName(currency) })}
        </span>
      </div>
      <FieldError id={errorId}>{shownError}</FieldError>
    </div>
  );
});
