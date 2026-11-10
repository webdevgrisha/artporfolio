import {
  type ColumnDef,
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
} from "@tanstack/react-table";

import type { TableRow } from "./tableRow";

interface DataTableColumnMeta {
  /** The class of the column's header and cells, such as its width. */
  className?: string;
  /** Hides the column on a phone, which keeps the photo, the title and the actions. */
  hiddenOnPhone?: boolean;
}

/**
 * What every table of the admin does: it sorts by one column and shows a page at a time. Columns
 * sort with a function of their own; `basic` is the one registered by name.
 */
export const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic },
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type DataTableFeatures = typeof dataTableFeatures;

/** A column of a DataTable that lists items of the given type. */
export type DataTableColumn<TItem> = ColumnDef<DataTableFeatures, TableRow<TItem>>;
