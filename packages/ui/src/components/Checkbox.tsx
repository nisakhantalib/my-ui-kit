import { forwardRef, useEffect, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx, useFieldIds, useMergedRef } from '../utils.js';
import { FieldError, FieldHint } from './Field.js';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: ReactNode;
  hint?: string;
  error?: string;
  /** "Some selected" state for a parent checkbox. Read as "mixed" by screen readers. */
  indeterminate?: boolean;
  id?: string;
}

/** Native checkbox with label, hint and error wired up. The whole label is the click target. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, error, indeterminate = false, id, className, ...rest },
  ref,
) {
  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);
  const [mergedRef, local] = useMergedRef(ref);

  // `indeterminate` is a DOM property only; there is no HTML attribute for it.
  useEffect(() => {
    if (local.current) local.current.indeterminate = indeterminate;
  }, [indeterminate, local]);

  return (
    <div className={cx('kit-check', error && 'kit-check--error', className)}>
      <input
        ref={mergedRef}
        type="checkbox"
        id={inputId}
        className="kit-check__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      <div className="kit-check__text">
        <label htmlFor={inputId} className="kit-check__label">
          {label}
        </label>
        <FieldHint id={hintId}>{hint}</FieldHint>
        <FieldError id={errorId}>{error}</FieldError>
      </div>
    </div>
  );
});
