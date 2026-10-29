import { cx, useControllableState } from '../utils.js';
import { useKit } from '../i18n.js';
import { VisuallyHidden } from './VisuallyHidden.js';

export interface MaskedValueProps {
  /** The full value, e.g. an account or card number. */
  value: string;
  /** What it is, used in the button and the spoken text: "account number". */
  label: string;
  /** Characters left visible at the end. Default 4. */
  visible?: number;
  /** Groups of this many characters when shown, for reading: 0123 4567 89. Default 4. */
  group?: number;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  className?: string;
}

/**
 * Sensitive value that is masked until asked for, e.g. an account number on a shared screen.
 * Masked, screen readers hear "Account number ending 6789" instead of a string of bullet characters.
 * The toggle is a real button with a constant label and aria-pressed, the APG toggle-button pattern,
 * so screen readers say "Show account number, toggle button, pressed".
 */
export function MaskedValue({
  value,
  label,
  visible = 4,
  group = 4,
  revealed,
  defaultRevealed = false,
  onRevealedChange,
  className,
}: MaskedValueProps) {
  const { t } = useKit();
  const [shown, setShown] = useControllableState(revealed, defaultRevealed, onRevealedChange);
  const last = value.slice(-visible);
  const grouped = value.replace(new RegExp(`(.{${group}})(?=.)`, 'g'), '$1 ');

  return (
    <span className={cx('kit-masked', className)}>
      <span className="kit-masked__value">
        {shown ? (
          grouped
        ) : (
          <>
            <span aria-hidden="true">•••• {last}</span>
            <VisuallyHidden>{t('masked.endingIn', { label, last })}</VisuallyHidden>
          </>
        )}
      </span>
      <button
        type="button"
        className="kit-masked__toggle"
        aria-pressed={shown}
        aria-label={t('masked.show', { label })}
        onClick={() => setShown(!shown)}
      >
        <span aria-hidden="true" className={cx('kit-masked__eye', shown && 'kit-masked__eye--off')} />
      </button>
    </span>
  );
}
