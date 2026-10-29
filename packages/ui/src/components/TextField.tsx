import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cx } from '../utils.js';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Helper text shown under the label, linked with aria-describedby. */
  hint?: string;
  /** Error message. When set, the input gets aria-invalid and the message is announced. */
  error?: string;
  id?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, required, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `kit-field-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('kit-field', error && 'kit-field--error', className)}>
      <label className="kit-field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="kit-field__required" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="kit-field__hint">
          {hint}
        </p>
      )}
      <input
        ref={ref}
        id={inputId}
        className="kit-field__input"
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {/* Live region: the message is read out when it appears, not only on focus. */}
      <p id={errorId} className="kit-field__error" aria-live="polite">
        {error && (
          <>
            <span aria-hidden="true">⚠ </span>
            {error}
          </>
        )}
      </p>
    </div>
  );
});
