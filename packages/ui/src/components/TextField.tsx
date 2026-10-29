import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx, useFieldIds } from '../utils.js';
import { FieldError, FieldHint, RequiredMark } from './Field.js';

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
  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);

  return (
    <div className={cx('kit-field', error && 'kit-field--error', className)}>
      <label className="kit-field__label" htmlFor={inputId}>
        {label}
        <RequiredMark show={required} />
      </label>
      <FieldHint id={hintId}>{hint}</FieldHint>
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
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
});
