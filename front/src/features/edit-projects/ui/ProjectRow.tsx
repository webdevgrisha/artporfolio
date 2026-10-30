import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Link } from "react-router";

import type { Project } from "@/entities/project";
import { projectPath } from "@/shared/config/routes";
import { ArrowDownIcon, ArrowUpIcon, DragHandleIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./ProjectsTable.module.css";

/** The buttons of a row the table moves the focus back to, named in `data-control`. */
export type ProjectRowControl = "moveDown" | "moveUp";

interface ProjectRowProps {
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  project: Project;
}

/** The host of a link, which is all the table has room for: «elephant.com». */
function formatLink(link: string): string {
  try {
    return new URL(link).host.replace(/^www\./, "");
  } catch {
    return link;
  }
}

/** One project of `ProjectsTable`: dragged by its handle, or moved with the arrow buttons. */
export function ProjectRow({
  disabled,
  isFirst,
  isLast,
  onDelete,
  onMoveDown,
  onMoveUp,
  project,
}: ProjectRowProps) {
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
  const [cover] = project.photos;
  const dragLabel = `Переместить ${project.title}`;
  const moveUpLabel = `Поднять ${project.title}`;
  const moveDownLabel = `Опустить ${project.title}`;
  const deleteLabel = `Удалить ${project.title}`;

  return (
    <tr
      ref={setNodeRef}
      className={clsx(styles.row, isDragging && styles.rowDragging)}
      // Translate only: scaling would stretch rows of different heights into each other.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-project-id={project.id}
    >
      <td className={styles.handleCell}>
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
      </td>
      <td>
        <div className={styles.photos}>
          {cover ? (
            <MediaImage className={styles.cover} source={imageToMediaItem(cover).source} />
          ) : (
            <span className={styles.cover} />
          )}
          <span className={styles.muted}>{project.photos.length} фото</span>
        </div>
      </td>
      <th className={styles.title} scope="row">
        <Link to={projectPath(project.id)}>{project.title}</Link>
      </th>
      <td>
        {project.link ? (
          <a href={project.link} target="_blank" rel="noreferrer">
            {formatLink(project.link)}
          </a>
        ) : (
          <span className={styles.muted}>Нет ссылки</span>
        )}
      </td>
      <td>
        <div className={styles.actions}>
          <Tooltip content={moveUpLabel}>
            <IconButton
              label={moveUpLabel}
              disabled={disabled || isFirst}
              data-control={"moveUp" satisfies ProjectRowControl}
              onClick={onMoveUp}
            >
              <ArrowUpIcon className={styles.arrowIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip content={moveDownLabel}>
            <IconButton
              label={moveDownLabel}
              disabled={disabled || isLast}
              data-control={"moveDown" satisfies ProjectRowControl}
              onClick={onMoveDown}
            >
              <ArrowDownIcon className={styles.arrowIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip content={deleteLabel}>
            <IconButton label={deleteLabel} disabled={disabled} onClick={onDelete}>
              <TrashIcon className={styles.removeIcon} />
            </IconButton>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}
