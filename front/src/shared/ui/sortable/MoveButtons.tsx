import { ArrowDownIcon, ArrowUpIcon } from "@/shared/ui/icon";
import { IconAction } from "@/shared/ui/icon-button";

import styles from "./Sortable.module.css";

/** The buttons of a row that useSortableRowFocus focuses again, named in `data-control`. */
export type MoveControl = "moveDown" | "moveUp";

interface MoveButtonsProps {
  disabled?: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** Names the item in the labels, e.g. «Поднять Акварель». */
  name: string;
  onMoveDown: () => void;
  onMoveUp: () => void;
}

/** Moves a row one place up or down without a pointer (WCAG 2.5.7). */
export function MoveButtons({
  disabled = false,
  isFirst,
  isLast,
  name,
  onMoveDown,
  onMoveUp,
}: MoveButtonsProps) {
  const upLabel = `Поднять ${name}`;
  const downLabel = `Опустить ${name}`;

  return (
    <>
      <IconAction
        tooltipClassName={styles.control}
        label={upLabel}
        disabled={disabled || isFirst}
        data-control={"moveUp" satisfies MoveControl}
        onClick={onMoveUp}
      >
        <ArrowUpIcon className={styles.arrowIcon} />
      </IconAction>
      <IconAction
        tooltipClassName={styles.control}
        label={downLabel}
        disabled={disabled || isLast}
        data-control={"moveDown" satisfies MoveControl}
        onClick={onMoveDown}
      >
        <ArrowDownIcon className={styles.arrowIcon} />
      </IconAction>
    </>
  );
}
