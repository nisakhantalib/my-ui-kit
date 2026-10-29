import { useCallback, useId, useRef, useState, type Ref, type RefCallback } from 'react';

/** Join class names, skipping falsy values. cx('a', false && 'b', 'c') -> 'a c' */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Elements that can receive keyboard focus, in DOM order. Used by Dialog's focus trap. */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

declare const process: { env: { NODE_ENV?: string } };

/** Consumers' bundlers replace the literal `process.env.NODE_ENV`; unbundled, `process` doesn't exist. */
function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

const warned = new Set<string>();

/**
 * Development-only, once per prop: deprecated props keep working until the next major
 * (see docs/governance.md), but every team hears about it while they still have time.
 */
export function warnDeprecated(component: string, prop: string, replacement: string, codemod?: string) {
  const key = `${component}.${prop}`;
  if (isProduction() || warned.has(key)) return;
  warned.add(key);
  console.warn(
    `[my-ui-kit] <${component} ${prop}> is deprecated and will be removed in 1.0.0. Use \`${replacement}\` instead.` +
      (codemod ? ` Codemod: npx @nisakhantalib/my-ui-kit-codemods ${codemod} src/` : ''),
  );
}

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * State that works controlled (`value` + `onChange`) or uncontrolled (`defaultValue`),
 * the same contract native inputs have. Every stateful component uses this, so they all
 * behave the same way.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [current, set];
}

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** Forward a ref while also keeping a local one, e.g. to set `indeterminate` on a checkbox. */
export function useMergedRef<T>(forwarded: Ref<T> | undefined): [RefCallback<T>, { current: T | null }] {
  const local = useRef<T | null>(null);
  const merged = useCallback<RefCallback<T>>(
    (node) => {
      local.current = node;
      setRef(forwarded, node);
    },
    [forwarded],
  );
  return [merged, local];
}

/**
 * Ids for a form control and its hint / error text, joined into aria-describedby.
 * Shared by TextField, Select, Checkbox and RadioGroup so every field is wired the same way.
 */
export function useFieldIds(id: string | undefined, hasHint: boolean, hasError: boolean) {
  const autoId = useId();
  const inputId = id ?? `kit-field-${autoId}`;
  const hintId = hasHint ? `${inputId}-hint` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { inputId, hintId, errorId, describedBy };
}
