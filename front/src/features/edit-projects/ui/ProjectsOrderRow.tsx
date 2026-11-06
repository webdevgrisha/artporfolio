import clsx from "clsx";

import type { ProjectSummary } from "@/entities/project";
import { PhotoThumbnail } from "@/shared/ui/media-preview";
import { DragHandle, MoveButtons, useSortableRow } from "@/shared/ui/sortable";

import styles from "./EditProjectsOrderForm.module.css";

interface ProjectsOrderRowProps {
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** Highlights a project that is not at its saved place. */
  isModified: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  project: ProjectSummary;
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
  const { handleProps, rowProps } = useSortableRow({
    disabled: disabled || isAlone,
    id: project.id,
    roleDescription: "перемещаемый проект",
  });

  return (
    <li
      {...rowProps}
      className={clsx(styles.row, isModified && styles.rowModified, rowProps.className)}
    >
      <DragHandle
        label={`Переместить ${project.title}`}
        disabled={disabled || isAlone}
        handleProps={handleProps}
      />
      <PhotoThumbnail className={styles.cover} image={project.photos[0]} />
      <span className={styles.title}>{project.title}</span>
      <div className={styles.arrows}>
        <MoveButtons
          name={project.title}
          disabled={disabled}
          isFirst={isFirst}
          isLast={isLast}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>
    </li>
  );
}
