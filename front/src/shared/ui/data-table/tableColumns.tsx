import type { ReactNode } from "react";

import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import type { DataTableColumn } from "./dataTableFeatures";
import styles from "./tableColumns.module.css";

/** «№»: the place of the item on the site. It sorts unless the site order is another column's. */
export function positionColumn<TItem>({
  isSortable,
}: {
  isSortable: boolean;
}): DataTableColumn<TItem> {
  return {
    id: "position",
    header: "№",
    meta: { className: styles.positionColumn, hiddenOnPhone: true },
    accessorFn: (row) => row.position,
    enableSorting: isSortable,
    cell: ({ row: { original } }) => <span className={styles.muted}>{original.position}</span>,
  };
}

/** The last column, without a visible name: the actions of the item, such as RowActions. */
export function actionsColumn<TItem>(render: (item: TItem) => ReactNode): DataTableColumn<TItem> {
  return {
    id: "actions",
    header: () => <VisuallyHidden>Действия</VisuallyHidden>,
    meta: { className: styles.actionsColumn },
    enableSorting: false,
    cell: ({ row: { original } }) => render(original.item),
  };
}
