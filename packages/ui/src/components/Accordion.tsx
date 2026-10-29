import { createContext, useContext, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx, useControllableState } from '../utils.js';
import { useTrack } from '../analytics/analytics.js';

/**
 * Accordion (WAI-ARIA APG pattern): each header is a real heading containing a button with
 * aria-expanded / aria-controls, so screen-reader users can jump by heading as well as Tab.
 *
 *   <Accordion type="single" defaultValue={['bring']} headingLevel={3}>
 *     <AccordionItem value="bring" title="What should I bring?">NRIC and any referral letter.</AccordionItem>
 *     <AccordionItem value="cancel" title="Can I cancel?">Up to 24 hours before.</AccordionItem>
 *   </Accordion>
 *
 * Keys: ↑/↓ move between headers, Home/End jump to first/last; Enter/Space toggle.
 */

interface AccordionContextValue {
  open: string[];
  toggle: (value: string) => void;
  headingLevel: 2 | 3 | 4 | 5 | 6;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface AccordionProps {
  /** `single`: opening one closes the others. `multiple`: each opens independently. */
  type?: 'single' | 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Match the page outline: the level below the section heading the accordion sits in. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: ReactNode;
}

export function Accordion({
  type = 'multiple',
  value,
  defaultValue = [],
  onValueChange,
  headingLevel = 3,
  className,
  children,
}: AccordionProps) {
  const [open, setOpen] = useControllableState(value, defaultValue, onValueChange);
  const rootRef = useRef<HTMLDivElement>(null);
  const track = useTrack();

  function toggle(item: string) {
    const isOpen = open.includes(item);
    const next = isOpen ? open.filter((v) => v !== item) : type === 'single' ? [item] : [...open, item];
    setOpen(next);
    track('accordion_toggle', { component: 'Accordion', item, expanded: !isOpen });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const triggers = Array.from(
      rootRef.current!.querySelectorAll<HTMLButtonElement>(':scope > .kit-accordion__item > * > .kit-accordion__trigger:not([disabled])'),
    );
    const current = triggers.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    let next = current;
    if (e.key === 'ArrowDown') next = (current + 1) % triggers.length;
    else if (e.key === 'ArrowUp') next = (current - 1 + triggers.length) % triggers.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = triggers.length - 1;
    else return;
    e.preventDefault();
    triggers[next]!.focus();
  }

  return (
    <AccordionContext.Provider value={{ open, toggle, headingLevel }}>
      <div ref={rootRef} className={cx('kit-accordion', className)} onKeyDown={onKeyDown}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  value: string;
  title: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}

export function AccordionItem({ value, title, disabled, children }: AccordionItemProps) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('<AccordionItem> must be used inside <Accordion>.');
  const id = useId();
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;
  const expanded = ctx.open.includes(value);
  const Heading = `h${ctx.headingLevel}` as const;

  return (
    <div className="kit-accordion__item">
      <Heading className="kit-accordion__heading">
        <button
          type="button"
          id={triggerId}
          aria-expanded={expanded}
          aria-controls={panelId}
          disabled={disabled}
          className="kit-accordion__trigger"
          onClick={() => ctx.toggle(value)}
        >
          <span>{title}</span>
          <span className="kit-accordion__icon" aria-hidden="true" />
        </button>
      </Heading>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!expanded} className="kit-accordion__panel">
        {children}
      </div>
    </div>
  );
}
