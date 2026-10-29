import { createContext, useContext, type ReactNode } from 'react';
import { cx, useControllableState, useFieldIds } from '../utils.js';
import { FieldError, FieldHint, RequiredMark } from './Field.js';

/**
 * Composable radio group built on native radios in a `<fieldset>`:
 *
 *   <RadioGroup legend="Clinic" name="clinic" value={clinic} onValueChange={setClinic} error={err}>
 *     <Radio value="tampines" label="Tampines Family Clinic" description="East" />
 *     <Radio value="jurong" label="Jurong West Medical Centre" description="West" />
 *   </RadioGroup>
 *
 * Native radios give the APG keyboard model for free: Tab enters the group once,
 * arrow keys move and select, and screen readers announce "1 of 3".
 */

interface RadioGroupContextValue {
  name: string;
  selected: string;
  select: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  legend: string;
  /** Shared `name` for the native radios; also what form submission uses. */
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** `cards` gives each option a bordered, full-width target (good on touch screens). */
  variant?: 'plain' | 'cards';
  id?: string;
  className?: string;
  children: ReactNode;
}

export function RadioGroup({
  legend,
  name,
  value,
  defaultValue = '',
  onValueChange,
  hint,
  error,
  required,
  disabled,
  variant = 'plain',
  id,
  className,
  children,
}: RadioGroupProps) {
  const [selected, select] = useControllableState(value, defaultValue, onValueChange);
  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);

  return (
    <RadioGroupContext.Provider value={{ name, selected, select, required, disabled }}>
      {/* role="radiogroup" (allowed on fieldset by ARIA in HTML) is what lets aria-invalid / aria-required apply to the group. */}
      <fieldset
        id={inputId}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role="radiogroup"
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        className={cx('kit-radio-group', `kit-radio-group--${variant}`, error && 'kit-radio-group--error', className)}
      >
        <legend className="kit-field__label">
          {legend}
          <RequiredMark show={required} />
        </legend>
        <FieldHint id={hintId}>{hint}</FieldHint>
        <div className="kit-radio-group__options">{children}</div>
        <FieldError id={errorId}>{error}</FieldError>
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps {
  value: string;
  label: ReactNode;
  /** Secondary text, read as part of the option's description. */
  description?: ReactNode;
  disabled?: boolean;
}

export function Radio({ value, label, description, disabled }: RadioProps) {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error('<Radio> must be used inside <RadioGroup>.');
  const { inputId: id, hintId: descId } = useFieldIds(undefined, !!description, false);

  return (
    <div className="kit-radio">
      <input
        type="radio"
        id={id}
        className="kit-radio__input"
        name={ctx.name}
        value={value}
        checked={ctx.selected === value}
        onChange={() => ctx.select(value)}
        disabled={disabled}
        required={ctx.required}
        aria-describedby={descId}
      />
      {/* The description sits outside the label so it is the radio's description, not part of its name. */}
      <div className="kit-radio__text">
        <label htmlFor={id} className="kit-radio__label">
          {label}
        </label>
        {description && (
          <span id={descId} className="kit-radio__desc">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
