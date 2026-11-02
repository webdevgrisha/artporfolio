import type { Project } from "@/entities/project";
import { projectPath } from "@/shared/config/routes";
import { EditIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton, IconButtonLink } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import { useIsDeletingProject } from "../model/useDeleteProject";
import styles from "./ProjectsTable.module.css";

interface ProjectActionsProps {
  /** Asks to confirm the deletion. */
  onDelete: (project: Project) => void;
  project: Project;
}

/** The actions of a row of the table: open the project, or delete it. */
export function ProjectActions({ onDelete, project }: ProjectActionsProps) {
  const isDeleting = useIsDeletingProject(project.id);
  const editLabel = `Изменить ${project.title}`;
  const deleteLabel = `Удалить ${project.title}`;

  return (
    <div className={styles.actions}>
      <Tooltip content={editLabel}>
        <IconButtonLink label={editLabel} to={projectPath(project.id)}>
          <EditIcon className={styles.editIcon} />
        </IconButtonLink>
      </Tooltip>
      <Tooltip content={deleteLabel}>
        <IconButton label={deleteLabel} disabled={isDeleting} onClick={() => onDelete(project)}>
          <TrashIcon className={styles.removeIcon} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
