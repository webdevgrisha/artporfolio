import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { ReactNode } from "react";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  AttachmentIcon,
  DragHandleIcon,
  TrashIcon,
} from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { MediaFileName, MediaThumbnailButton } from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./SortableMediaList.module.css";
import type { SortableMediaItem } from "./sortableMediaItem";

/** The buttons of a row the list can move the focus to, named in `data-control`. */
export type RowControl = "moveDown" | "moveUp" | "remove";

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
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    attributes: { roleDescription: "перемещаемое фото" },
    disabled: disabled || isAlone,
    id: item.id,
  });
  const dragLabel = `Переместить ${item.name}`;
  const moveUpLabel = `Поднять ${item.name}`;
  const moveDownLabel = `Опустить ${item.name}`;
  const replaceLabel = `Заменить ${item.name}`;
  const removeLabel = `Удалить ${item.name}`;

  return (
    <li
      ref={setNodeRef}
      className={clsx(styles.row, {
        [styles.rowModified]: item.isModified,
        [styles.rowDragging]: isDragging,
      })}
      // Translate only: scaling would stretch rows of different heights into each other.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-item-id={item.id}
    >
      <div className={styles.rowHeader}>
        <Tooltip className={styles.controlTooltip} content={dragLabel}>
          <IconButton
            ref={setActivatorNodeRef}
            className={styles.dragHandle}
            label={dragLabel}
            disabled={isAlone}
            {...attributes}
            {...listeners}
          >
            <DragHandleIcon className={styles.dragIcon} />
          </IconButton>
        </Tooltip>

        <MediaThumbnailButton className={styles.controlTooltip} item={item} onOpen={onOpen} />
        <MediaFileName className={styles.fileName} item={item} />

        <div className={styles.rowActions}>
          <Tooltip className={styles.controlTooltip} content={moveUpLabel}>
            <IconButton
              label={moveUpLabel}
              disabled={isFirst}
              data-control={"moveUp" satisfies RowControl}
              onClick={onMoveUp}
            >
              <ArrowUpIcon className={styles.arrowIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip className={styles.controlTooltip} content={moveDownLabel}>
            <IconButton
              label={moveDownLabel}
              disabled={isLast}
              data-control={"moveDown" satisfies RowControl}
              onClick={onMoveDown}
            >
              <ArrowDownIcon className={styles.arrowIcon} />
            </IconButton>
          </Tooltip>
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
