import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cx, useFieldIds } from '../utils.js';
import { FieldError, FieldHint, RequiredMark } from './Field.js';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  /** Adds an empty first option, e.g. "Choose a time". Not selectable once a value is picked. */
  placeholder?: string;
  id?: string;
  /** `<option>` / `<optgroup>` elements. */
  children: ReactNode;
}

/**
 * A styled native `<select>`. Native on purpose: phones show their own picker, every screen
 * reader already knows it, and typeahead / keyboard behaviour come for free (see ADR 0004).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, placeholder, required, id, className, children, ...rest },
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
      <div className="kit-select">
        <select
          ref={ref}
          id={inputId}
          className="kit-field__input kit-select__control"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
});
