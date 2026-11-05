import clsx from "clsx";
import type { ReactNode } from "react";

import { AttachmentIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { MediaFileName, MediaThumbnailButton } from "@/shared/ui/media-preview";
import { DragHandle, MoveButtons, type MoveControl, useSortableRow } from "@/shared/ui/sortable";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./SortableMediaList.module.css";
import type { SortableMediaItem } from "./sortableMediaItem";

/** The buttons of a row the list can move the focus to, named in `data-control`. */
export type RowControl = MoveControl | "remove";

interface SortableMediaRowProps {
  /** The fields of the item, such as its description, under the file. */
  children?: ReactNode;
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  item: SortableMediaItem;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onOpen: () => void;
  onRemove: () => void;
  onReplace: () => void;
}

/** One item of `SortableMediaList`: dragged by its handle, or moved with the arrow buttons. */
export function SortableMediaRow({
  children,
  disabled,
  isFirst,
  isLast,
  item,
  onMoveDown,
  onMoveUp,
  onOpen,
  onRemove,
  onReplace,
}: SortableMediaRowProps) {
  // A single item has nowhere to go: its handle is disabled like both of its arrows.
  const isAlone = isFirst && isLast;
  const { handleProps, rowProps } = useSortableRow({
    disabled: disabled || isAlone,
    id: item.id,
    roleDescription: "перемещаемое фото",
  });
  const replaceLabel = `Заменить ${item.name}`;
  const removeLabel = `Удалить ${item.name}`;

  return (
    <li
      {...rowProps}
      className={clsx(styles.row, item.isModified && styles.rowModified, rowProps.className)}
    >
      <div className={styles.rowHeader}>
        <DragHandle
          label={`Переместить ${item.name}`}
          disabled={isAlone}
          handleProps={handleProps}
        />

        <MediaThumbnailButton className={styles.controlTooltip} item={item} onOpen={onOpen} />
        <MediaFileName className={styles.fileName} item={item} />

        <div className={styles.rowActions}>
          <MoveButtons
            name={item.name}
            isFirst={isFirst}
            isLast={isLast}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
          <Tooltip className={styles.controlTooltip} content={replaceLabel}>
            <IconButton label={replaceLabel} onClick={onReplace}>
              <AttachmentIcon className={styles.replaceIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip className={styles.controlTooltip} content={removeLabel}>
            <IconButton
              label={removeLabel}
              data-control={"remove" satisfies RowControl}
              onClick={onRemove}
            >
              <TrashIcon className={styles.removeIcon} />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {children ? <div className={styles.rowFields}>{children}</div> : null}
    </li>
  );
}
