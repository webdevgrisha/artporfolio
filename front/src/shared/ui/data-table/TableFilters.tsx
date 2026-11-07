import clsx from "clsx";

import type { TableFilter } from "@/shared/lib/tableView";
import { Select } from "@/shared/ui/select";

import styles from "./DataTable.module.css";

interface TableFiltersProps<TItem> {
  filters: readonly TableFilter<TItem>[];
  /** Referenced by the button that opens the filters on a phone. */
  id: string;
  isOpen: boolean;
  onChange: (id: string, value: string) => void;
  /** The chosen value by the id of its filter. */
  values: Readonly<Record<string, string>>;
}

/** The choice of a filter that shows every row. */
const everyItemOption = { label: "Все", value: "" };

/** The lists under the search of a table that narrow its rows. */
export function TableFilters<TItem>({
  filters,
  id,
  isOpen,
  onChange,
  values,
}: TableFiltersProps<TItem>) {
  return (
    <div id={id} className={clsx(styles.filters, !isOpen && styles.filtersClosed)}>
      {filters.map((filter) => (
        <Select
          key={filter.id}
          className={styles.filter}
          label={filter.label}
          options={[everyItemOption, ...filter.options]}
          value={values[filter.id] ?? ""}
          onChange={(value) => onChange(filter.id, value)}
        />
      ))}
    </div>
  );
}
