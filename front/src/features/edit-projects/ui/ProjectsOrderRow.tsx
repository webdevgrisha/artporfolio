import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

import type { Project } from "@/entities/project";
import { ArrowDownIcon, ArrowUpIcon, DragHandleIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { PhotoThumbnail } from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./EditProjectsOrderForm.module.css";

/** The buttons of a row the list moves the focus back to, named in `data-control`. */
export type OrderRowControl = "moveDown" | "moveUp";

interface ProjectsOrderRowProps {
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** Highlights a project that is not at its saved place. */
  isModified: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  project: Project;
}

/** One project of the order: dragged by its handle, or moved with the arrow buttons. */
export function ProjectsOrderRow({
  disabled,
  isFirst,
  isLast,
  isModified,
  onMoveDown,
  onMoveUp,
  project,
}: ProjectsOrderRowProps) {
  // A single project has nowhere to go: its handle is disabled like both of its arrows.
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
    attributes: { roleDescription: "перемещаемый проект" },
    disabled: disabled || isAlone,
    id: project.id,
  });
  const dragLabel = `Переместить ${project.title}`;
  const moveUpLabel = `Поднять ${project.title}`;
  const moveDownLabel = `Опустить ${project.title}`;

  return (
    <li
      ref={setNodeRef}
      className={clsx(
        styles.row,
        isModified && styles.rowModified,
        isDragging && styles.rowDragging,
      )}
      // Translate only: scaling would stretch rows of different heights into each other.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-item-id={project.id}
    >
      <Tooltip content={dragLabel}>
        <IconButton
          ref={setActivatorNodeRef}
          className={styles.dragHandle}
          label={dragLabel}
          disabled={disabled || isAlone}
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon className={styles.dragIcon} />
        </IconButton>
      </Tooltip>

      <PhotoThumbnail className={styles.cover} image={project.photos[0]} />
      <span className={styles.title}>{project.title}</span>

      <div className={styles.arrows}>
        <Tooltip content={moveUpLabel}>
          <IconButton
            label={moveUpLabel}
            disabled={disabled || isFirst}
            data-control={"moveUp" satisfies OrderRowControl}
            onClick={onMoveUp}
          >
            <ArrowUpIcon className={styles.arrowIcon} />
          </IconButton>
        </Tooltip>
        <Tooltip content={moveDownLabel}>
          <IconButton
            label={moveDownLabel}
            disabled={disabled || isLast}
            data-control={"moveDown" satisfies OrderRowControl}
            onClick={onMoveDown}
          >
            <ArrowDownIcon className={styles.arrowIcon} />
          </IconButton>
        </Tooltip>
      </div>
    </li>
  );
}
