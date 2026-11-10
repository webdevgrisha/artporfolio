import { flexRender, type RowData, type Table } from "@tanstack/react-table";
import clsx from "clsx";

import styles from "./DataTable.module.css";
import type { DataTableFeatures } from "./dataTableFeatures";
import columnStyles from "./tableColumns.module.css";

interface TableBodyProps<TData extends RowData> {
  table: Table<DataTableFeatures, TData>;
}

/** The rows of the current page of a TanStack table. */
export function TableBody<TData extends RowData>({ table }: TableBodyProps<TData>) {
  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <tr key={row.id} className={styles.row}>
          {row.getAllCells().map((cell) => {
            const { meta } = cell.column.columnDef;

            return (
              <td
                key={cell.id}
                className={clsx(meta?.className, meta?.hiddenOnPhone && columnStyles.hiddenOnPhone)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}
