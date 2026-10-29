import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx, useControllableState, useFieldIds } from '../utils.js';
import { useKit } from '../i18n.js';
import { FieldError, FieldHint, RequiredMark } from './Field.js';
import { VisuallyHidden } from './VisuallyHidden.js';

export interface ComboboxProps<T> {
  label: string;
  items: readonly T[];
  getKey: (item: T) => string;
  /** Text shown in the input once chosen, and what filtering matches against. */
  getLabel: (item: T) => string;
  /** Richer option content (e.g. name + masked account). Defaults to the label. */
  renderOption?: (item: T) => ReactNode;
  /** Custom matching. Default: case-insensitive "contains" on getLabel. */
  filter?: (item: T, query: string) => boolean;
  /** Key of the chosen item. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (key: string | null, item: T | null) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Searchable single-select: WAI-ARIA APG "combobox with listbox popup, list autocomplete,
 * manual selection". Focus stays in the input; the highlighted option is conveyed with
 * aria-activedescendant, so screen readers read it without the caret moving.
 *
 * Keys: ↓/↑ open and move · Enter selects · Escape closes, then clears · Alt+↓ opens without moving.
 * The result count is announced politely after typing ("3 results available").
 * Leaving the field with text that matches nothing restores the last valid choice.
 */
export function Combobox<T>({
  label,
  items,
  getKey,
  getLabel,
  renderOption,
  filter,
  value,
  defaultValue = null,
  onValueChange,
  hint,
  error,
  placeholder,
  required,
  disabled,
  id,
  className,
}: ComboboxProps<T>) {
  const { t } = useKit();
  const [selectedKey, setSelectedKey] = useControllableState<string | null>(value, defaultValue);
  const selected = items.find((i) => getKey(i) === selectedKey) ?? null;
  const [query, setQuery] = useState(selected ? getLabel(selected) : '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [typed, setTyped] = useState(false); // filter only after the user types, not on reopening
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);

  const matches = useMemo(() => {
    if (!typed || !query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) => (filter ? filter(item, query) : getLabel(item).toLowerCase().includes(q)));
  }, [items, query, typed, filter, getLabel]);

  // When the chosen item changes from outside, show its label (React's "adjust state on prop change").
  const [shownKey, setShownKey] = useState(selectedKey);
  if (shownKey !== selectedKey) {
    setShownKey(selectedKey);
    setQuery(selected ? getLabel(selected) : '');
  }

  // Announce the count after typing settles, not on every keystroke.
  useEffect(() => {
    if (!open || !typed) return;
    const timer = setTimeout(() => setAnnouncement(t('combobox.results', { count: matches.length })), 400);
    return () => clearTimeout(timer);
  }, [matches.length, open, typed, t]);

  // Keep the highlighted option visible inside the scrolling list.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex]);

  function choose(item: T | null) {
    const key = item ? getKey(item) : null;
    setSelectedKey(key);
    onValueChange?.(key, item);
    setQuery(item ? getLabel(item) : '');
    setOpen(false);
    setTyped(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          if (!e.altKey) setActiveIndex(0);
        } else setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(matches.length - 1);
        } else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (open && activeIndex >= 0 && matches[activeIndex]) {
          e.preventDefault(); // don't submit the form
          choose(matches[activeIndex]);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          e.stopPropagation(); // don't close a surrounding dialog as well
          setOpen(false);
          setActiveIndex(-1);
        } else if (query) {
          e.preventDefault();
          choose(null);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  const activeId =
    open && activeIndex >= 0 && matches[activeIndex] ? `${listId}-${getKey(matches[activeIndex])}` : undefined;

  return (
    <div className={cx('kit-field', 'kit-combobox', error && 'kit-field--error', className)}>
      <label className="kit-field__label" htmlFor={inputId}>
        {label}
        <RequiredMark show={required} />
      </label>
      <FieldHint id={hintId}>{hint}</FieldHint>
      <div className="kit-combobox__control">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="kit-field__input kit-combobox__input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTyped(true);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setOpen(false);
            setActiveIndex(-1);
            setTyped(false);
            // Free text that isn't an option can't be "chosen": restore the last valid choice.
            setQuery(selected ? getLabel(selected) : '');
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={t('combobox.showOptions')}
          aria-controls={listId}
          aria-expanded={open}
          disabled={disabled}
          className="kit-combobox__toggle"
          // mousedown, not click: keep focus in the input so the listbox stays associated with it.
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
        >
          <span aria-hidden="true" className="kit-combobox__chevron" />
        </button>
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          hidden={!open}
          className="kit-combobox__listbox"
        >
          {matches.map((item, index) => {
            const key = getKey(item);
            return (
              // aria-activedescendant pattern: the input keeps focus and handles every key, so options are
              // deliberately not focusable and have no key handlers of their own.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
              <div
                key={key}
                id={`${listId}-${key}`}
                role="option"
                aria-selected={key === selectedKey}
                className={cx('kit-combobox__option', index === activeIndex && 'kit-combobox__option--active')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
                onMouseMove={() => index !== activeIndex && setActiveIndex(index)}
              >
                {renderOption ? renderOption(item) : getLabel(item)}
              </div>
            );
          })}
          {matches.length === 0 && <div className="kit-combobox__empty">{t('combobox.empty')}</div>}
        </div>
      </div>
      <FieldError id={errorId}>{error}</FieldError>
      <VisuallyHidden>
        <span role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </span>
      </VisuallyHidden>
    </div>
  );
}
