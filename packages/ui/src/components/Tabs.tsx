import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../utils.js';
import { useTrack } from '../analytics/analytics.js';

/**
 * Composable tabs (WAI-ARIA APG "Tabs" pattern) with roving tabindex.
 *
 *   <Tabs defaultValue="details">
 *     <TabList label="Booking steps">
 *       <Tab value="details">Details</Tab>
 *       <Tab value="review">Review</Tab>
 *     </TabList>
 *     <TabPanel value="details">…</TabPanel>
 *     <TabPanel value="review">…</TabPanel>
 *   </Tabs>
 *
 * Keys: ←/→ move between tabs, Home/End jump to first/last.
 * activation="automatic" selects on focus; "manual" waits for Enter/Space.
 */

interface TabsContextValue {
  baseId: string;
  selected: string;
  select: (value: string) => void;
  activation: 'automatic' | 'manual';
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab, TabList and TabPanel must be used inside <Tabs>.');
  return ctx;
}

export interface TabsProps {
  defaultValue?: string;
  /** Controlled value. Use with onValueChange. */
  value?: string;
  onValueChange?: (value: string) => void;
  activation?: 'automatic' | 'manual';
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue = '', value, onValueChange, activation = 'automatic', children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const baseId = useId();
  const track = useTrack();
  const selected = value ?? internal;

  function select(next: string) {
    if (next === selected) return;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    track('tab_change', { component: 'Tabs', tab: next });
  }

  return (
    <TabsContext.Provider value={{ baseId, selected, select, activation }}>
      <div className={cx('kit-tabs', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ label, children }: { label: string; children: ReactNode }) {
  const { select, activation } = useTabs();
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(
      listRef.current!.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;

    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;

    e.preventDefault();
    const tab = tabs[next]!;
    tab.focus();
    if (activation === 'automatic') select(tab.dataset.value!);
  }

  return (
    <div ref={listRef} role="tablist" aria-label={label} className="kit-tabs__list" onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

export function Tab({ value, disabled, children }: { value: string; disabled?: boolean; children: ReactNode }) {
  const { baseId, selected, select } = useTabs();
  const isSelected = selected === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      data-value={value}
      className="kit-tabs__tab"
      onClick={() => select(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { baseId, selected } = useTabs();
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={selected !== value}
      tabIndex={0}
      className="kit-tabs__panel"
    >
      {children}
    </div>
  );
}
