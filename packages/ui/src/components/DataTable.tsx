import { useId, useMemo, useState, type ReactNode } from 'react';
import { cx } from '../utils.js';
import { useKit } from '../i18n.js';
import { VisuallyHidden } from './VisuallyHidden.js';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Plain-text column name for announcements ("Sorted by Amount"). Defaults to header if it's a string. */
  name?: string;
  cell: (row: T) => ReactNode;
  /** Value to sort by. Columns without it aren't sortable. */
  sortValue?: (row: T) => string | number;
  /** 'end' for numbers and money, so digits line up. */
  align?: 'start' | 'end';
  /** Row header (`<th scope="row">`): the cell that names the row, e.g. the description. */
  rowHeader?: boolean;
}

export interface DataTableProps<T> {
  /** Required: the table's accessible name, also shown above it. */
  caption: ReactNode;
  captionHidden?: boolean;
  columns: Column<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  defaultSort?: { key: string; direction: 'ascending' | 'descending' };
  emptyMessage?: ReactNode;
  className?: string;
}

/**
 * A real `<table>` (not divs), so screen readers can move by row and column and announce headers.
 * Sortable columns put a button in the header and set aria-sort on the sorted one (APG "Sortable
 * Table"). The current sort is stated in the caption, because aria-sort changes are not announced
 * by every screen reader. On narrow screens the table scrolls inside a keyboard-focusable region.
 */
export function DataTable<T>({
  caption,
  captionHidden,
  columns,
  rows,
  getRowKey,
  defaultSort,
  emptyMessage,
  className,
}: DataTableProps<T>) {
  const { t, locale } = useKit();
  const [sort, setSort] = useState(defaultSort);
  const captionId = useId();

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort?.key);
    if (!sort || !column?.sortValue) return rows;
    const collator = new Intl.Collator(locale, { numeric: true });
    const dir = sort.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const [x, y] = [column.sortValue!(a), column.sortValue!(b)];
      return dir * (typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y)));
    });
  }, [rows, columns, sort, locale]);

  const sortedColumn = columns.find((c) => c.key === sort?.key);
  const columnName = (c: Column<T>) => c.name ?? (typeof c.header === 'string' ? c.header : c.key);

  return (
    // Focusable so keyboard users can scroll it sideways on small screens (axe: scrollable-region-focusable).
    <div className={cx('kit-table-wrap', className)} role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className="kit-table">
        <caption id={captionId} className={cx('kit-table__caption', captionHidden && 'kit-sr-only')}>
          {caption}
          {sort && sortedColumn && (
            <VisuallyHidden>
              {`, ${t('table.sortedBy', { column: columnName(sortedColumn), direction: t(sort.direction === 'ascending' ? 'table.ascending' : 'table.descending') })}`}
            </VisuallyHidden>
          )}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const isSorted = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={isSorted ? sort!.direction : undefined}
                  className={cx('kit-table__th', c.align === 'end' && 'kit-table__cell--end')}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      className="kit-table__sort"
                      onClick={() =>
                        setSort({
                          key: c.key,
                          direction: isSorted && sort!.direction === 'ascending' ? 'descending' : 'ascending',
                        })
                      }
                    >
                      {c.header}
                      <span
                        aria-hidden="true"
                        className={cx('kit-table__sort-icon', isSorted && `kit-table__sort-icon--${sort!.direction}`)}
                      />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="kit-table__empty">
                {emptyMessage ?? t('table.empty')}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((c) => {
                  const Cell = c.rowHeader ? 'th' : 'td';
                  return (
                    <Cell
                      key={c.key}
                      scope={c.rowHeader ? 'row' : undefined}
                      className={cx('kit-table__cell', c.align === 'end' && 'kit-table__cell--end')}
                    >
                      {c.cell(row)}
                    </Cell>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
