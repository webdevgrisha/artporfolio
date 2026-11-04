import { flexRender, type RowData, type SortDirection, type Table } from "@tanstack/react-table";
import clsx from "clsx";

import { ArrowDownIcon, ArrowUpIcon, SortIcon } from "@/shared/ui/icon";

import styles from "./TableHead.module.css";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** The class of the column's header and cells, such as its width. */
    className?: string;
  }
}

const ariaSort = {
  asc: "ascending",
  desc: "descending",
} as const satisfies Record<SortDirection, string>;

/** Which way a column is sorted: an arrow once it is, a pale double arrowhead until then. */
function SortState({ direction }: { direction: SortDirection | false }) {
  if (direction === "asc") return <ArrowUpIcon className={styles.sortArrow} />;
  if (direction === "desc") return <ArrowDownIcon className={styles.sortArrow} />;

  return <SortIcon className={styles.sortIdle} />;
}

interface TableHeadProps<TData> {
  table: Table<TData>;
}

/**
 * The names of the columns of a TanStack table. A column that sorts is named by a button, which
 * cycles it through ascending, descending and unsorted; the header says the state to screen readers
 * by `aria-sort`, and the sorted column stands out from the muted ones.
 */
export function TableHead<TData>({ table }: TableHeadProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const sorted = header.column.getIsSorted();
            const canSort = header.column.getCanSort();
            const label = flexRender(header.column.columnDef.header, header.getContext());

            return (
              <th
                key={header.id}
                className={clsx(
                  header.column.columnDef.meta?.className,
                  sorted && styles.sortedHeader,
                )}
                scope="col"
                aria-sort={canSort ? (sorted ? ariaSort[sorted] : "none") : undefined}
              >
                {canSort ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {label}
                    <SortState direction={sorted} />
                  </button>
                ) : (
                  label
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
