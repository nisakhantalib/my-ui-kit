import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { cx, useControllableState, useFieldIds } from '../utils.js';
import { useKit } from '../i18n.js';
import { FieldError, FieldHint } from './Field.js';
import { VisuallyHidden } from './VisuallyHidden.js';

export interface OTPInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'maxLength'
> {
  label: string;
  hint?: string;
  error?: string;
  /** Number of digits. Default 6. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called once all digits are entered. */
  onComplete?: (value: string) => void;
  /** Show a "Resend code" button that unlocks after this many seconds. */
  resendAfter?: number;
  onResend?: () => void;
  id?: string;
}

/**
 * One-time password field.
 *
 * One real input, drawn as boxes. Six separate inputs (the common pattern) make screen readers
 * announce six unlabelled fields, break paste, and break SMS autofill. A single
 * `autocomplete="one-time-code"` input gets iOS / Android code suggestions, paste and
 * password-manager fill for free.
 *
 * The resend countdown is visible but not live (a ticking announcement every second is noise);
 * screen readers are told once, when the button becomes available.
 */
export const OTPInput = forwardRef<HTMLInputElement, OTPInputProps>(function OTPInput(
  {
    label,
    hint,
    error,
    length = 6,
    value,
    defaultValue = '',
    onValueChange,
    onComplete,
    resendAfter,
    onResend,
    id,
    className,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const { t } = useKit();
  const [code, setCode] = useControllableState(value, defaultValue, onValueChange);
  const [focused, setFocused] = useState(false);
  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);

  // Resend countdown.
  const [secondsLeft, setSecondsLeft] = useState(resendAfter ?? 0);
  const [status, setStatus] = useState('');
  const announcedReady = useRef(false);
  useEffect(() => {
    if (resendAfter === undefined || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendAfter, secondsLeft]);
  useEffect(() => {
    if (resendAfter !== undefined && secondsLeft === 0 && !announcedReady.current) {
      announcedReady.current = true;
      setStatus(t('otp.canResend'));
    }
  }, [resendAfter, secondsLeft, t]);

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, length);
    setCode(digits);
    if (digits.length === length && digits !== code) onComplete?.(digits);
  }

  function resend() {
    if (secondsLeft > 0) return;
    onResend?.();
    setCode('');
    announcedReady.current = false;
    setSecondsLeft(resendAfter ?? 0);
    setStatus(t('otp.sent'));
  }

  const active = Math.min(code.length, length - 1);

  return (
    <div className={cx('kit-field', 'kit-otp', error && 'kit-field--error', className)}>
      <label className="kit-field__label" htmlFor={inputId}>
        {label}
      </label>
      <FieldHint id={hintId}>{hint}</FieldHint>
      <div className="kit-otp__boxes">
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          // No maxLength: it would cut a pasted "987 654" to "987 65" before the space is stripped.
          className="kit-otp__input"
          value={code}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cx(
              'kit-otp__box',
              focused && i === active && 'kit-otp__box--active',
              code[i] && 'kit-otp__box--filled',
            )}
          >
            {code[i] ?? ''}
          </span>
        ))}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
      {resendAfter !== undefined && (
        <div className="kit-otp__resend">
          {secondsLeft > 0 ? (
            <span className="kit-field__hint">{t('otp.resendIn', { seconds: secondsLeft })}</span>
          ) : (
            <button type="button" className="kit-link-button" onClick={resend}>
              {t('otp.resend')}
            </button>
          )}
        </div>
      )}
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {status}
        </span>
      </VisuallyHidden>
    </div>
  );
});
