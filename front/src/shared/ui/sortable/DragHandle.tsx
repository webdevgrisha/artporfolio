import { DragHandleIcon } from "@/shared/ui/icon";
import { IconAction } from "@/shared/ui/icon-button";

import styles from "./Sortable.module.css";
import type { SortableHandleProps } from "./useSortableRow";

interface DragHandleProps {
  disabled: boolean;
  /** From useSortableRow. */
  handleProps: SortableHandleProps;
  /** E.g. «Переместить Акварель». */
  label: string;
}

/** The handle a row of a SortableList is dragged by. */
export function DragHandle({ disabled, handleProps, label }: DragHandleProps) {
  return (
    <IconAction
      tooltipClassName={styles.control}
      className={styles.handle}
      label={label}
      disabled={disabled}
      {...handleProps}
    >
      <DragHandleIcon className={styles.handleIcon} />
    </IconAction>
  );
}
