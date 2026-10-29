import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx, useControllableState } from '../utils.js';
import { useTrack } from '../analytics/analytics.js';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'> {
  label: ReactNode;
  /** Extra text read after the label, e.g. what turning it on does. */
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** If set, a `switch_toggle` analytics event is sent with this id. */
  trackId?: string;
}

/**
 * On/off setting that applies immediately (APG "Switch" pattern): a `<button role="switch">`
 * with aria-checked. Use a Checkbox instead when the choice is only applied on form submit.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { label, description, checked, defaultChecked = false, onCheckedChange, trackId, id, className, disabled, onClick, ...rest },
  ref,
) {
  const [on, setOn] = useControllableState(checked, defaultChecked, onCheckedChange);
  const autoId = useId();
  const buttonId = id ?? `kit-switch-${autoId}`;
  const descId = description ? `${buttonId}-desc` : undefined;
  const track = useTrack();

  return (
    <div className={cx('kit-switch', className)}>
      <button
        ref={ref}
        type="button"
        role="switch"
        id={buttonId}
        aria-checked={on}
        aria-describedby={descId}
        disabled={disabled}
        className="kit-switch__control"
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          setOn(!on);
          if (trackId) track('switch_toggle', { component: 'Switch', id: trackId, checked: !on });
        }}
        {...rest}
      >
        <span className="kit-switch__thumb" aria-hidden="true" />
      </button>
      <div className="kit-switch__text">
        <label htmlFor={buttonId} className="kit-switch__label">
          {label}
        </label>
        {description && (
          <p id={descId} className="kit-field__hint">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});
