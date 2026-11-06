import type { ColumnDef } from "@tanstack/react-table";
import type { ProjectSummary } from "@/entities/project";
import { projectPath } from "@/shared/config/routes";
import { compareText } from "@/shared/lib/compareText";
import { actionsColumn, positionColumn, RowActions, type TableRow } from "@/shared/ui/data-table";
import { ExternalLinkIcon } from "@/shared/ui/icon";
import { PhotoThumbnail } from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { linkHost } from "../model/projectsTableView";
import styles from "./ProjectsTable.module.css";

interface ProjectsColumnsParams {
  /** The projects being deleted, by id. */
  deletingIds: readonly string[];
  onDelete: (project: ProjectSummary) => void;
}

/** The columns of the table of projects. */
export function projectsColumns({
  deletingIds,
  onDelete,
}: ProjectsColumnsParams): ColumnDef<TableRow<ProjectSummary>>[] {
  return [
    positionColumn({ isSortable: true }),
    {
      id: "photos",
      header: "Фото",
      meta: { className: styles.photoColumn },
      enableSorting: false,
      // The first photo is the cover of the project.
      cell: ({ row: { original } }) => <PhotoThumbnail image={original.item.photos[0]} />,
    },
    {
      id: "title",
      header: "Название",
      accessorFn: (row) => row.item.title,
      sortingFn: (a, b) => compareText(a.original.item.title, b.original.item.title),
    },
    {
      id: "link",
      header: "Ссылка",
      meta: { className: styles.linkColumn, hiddenOnPhone: true },
      accessorFn: (row) => linkHost(row.item.link),
      sortingFn: (a, b) =>
        compareText(linkHost(a.original.item.link), linkHost(b.original.item.link)),
      cell: ({ row: { original } }) => {
        const { link } = original.item;

        return link ? (
          <Tooltip content={link}>
            <a className={styles.externalLink} href={link} target="_blank" rel="noreferrer">
              <span className={styles.externalHost}>{linkHost(link)}</span>
              <ExternalLinkIcon className={styles.externalIcon} />
              <VisuallyHidden>(откроется в новой вкладке)</VisuallyHidden>
            </a>
          </Tooltip>
        ) : (
          <span className={styles.none}>Нет ссылки</span>
        );
      },
    },
    actionsColumn((project) => (
      <RowActions
        title={project.title}
        editTo={projectPath(project.id)}
        isDeleting={deletingIds.includes(project.id)}
        onDelete={() => onDelete(project)}
      />
    )),
  ];
}
