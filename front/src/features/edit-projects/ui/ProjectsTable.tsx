import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import clsx from "clsx";
import React from "react";

import type { Project } from "@/entities/project";
import type { Tagged } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { useDeleteProject, useReorderProjects } from "../model/projectsListMutations";
import { ProjectRow, type ProjectRowControl } from "./ProjectRow";
import styles from "./ProjectsTable.module.css";

interface ProjectsTableProps {
  className?: string;
  /** The ids in the order the site shows them, with the ETag that a new order sends back. */
  order: Tagged<string[]>;
  /** In the order the site shows them. */
  projects: readonly Project[];
}

// Rows only move up and down.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const screenReaderInstructions = {
  draggable:
    "Чтобы взять проект, нажмите пробел или Enter. Стрелками вверх и вниз выберите новое место, " +
    "затем нажмите пробел или Enter. Escape отменяет перемещение",
};

/**
 * Every project in the order the site shows them. A project is moved by dragging its handle or
 * with the arrow buttons, which also work without a pointer (WCAG 2.5.7); the new order is saved
 * at once. A project opens for editing by its title and is deleted after a confirmation.
 */
export function ProjectsTable({ className, order, projects }: ProjectsTableProps) {
  const reorder = useReorderProjects();
  const deletion = useDeleteProject();
  const [deleted, setDeleted] = React.useState<Project>();
  // Announces a move made with the arrow buttons; dnd-kit announces the dragged ones.
  const [moveAnnouncement, setMoveAnnouncement] = React.useState("");
  // The arrow button that moved its row; its row is moved in the DOM, which drops the focus.
  const focusedControlRef = React.useRef<{ control: ProjectRowControl; id: string }>(undefined);
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const isBusy = reorder.isPending || deletion.isPending;

  React.useLayoutEffect(() => {
    const target = focusedControlRef.current;
    if (!target) return;

    focusedControlRef.current = undefined;
    const row = bodyRef.current?.querySelector(`[data-project-id="${CSS.escape(target.id)}"]`);
    // An arrow is disabled at the end of the list: the other one takes the focus.
    const button =
      row?.querySelector<HTMLButtonElement>(`[data-control="${target.control}"]:not(:disabled)`) ??
      row?.querySelector<HTMLButtonElement>('[data-control^="move"]:not(:disabled)');
    button?.focus();
  });

  function getIndex(id: string): number {
    return projects.findIndex((project) => project.id === id);
  }

  function getTitle(id: string): string {
    return projects[getIndex(id)]?.title ?? "";
  }

  function getPosition(id: string): string {
    return `${String(getIndex(id) + 1)} из ${String(projects.length)}`;
  }

  function moveProject(from: number, to: number, control?: ProjectRowControl) {
    const project = projects[from];
    if (!project) return;

    if (control) {
      focusedControlRef.current = { control, id: project.id };
      setMoveAnnouncement(
        `Проект «${project.title}» перемещён на место ${String(to + 1)} из ${String(projects.length)}`,
      );
    }
    reorder.mutate({
      etag: order.etag,
      ids: arrayMove(
        projects.map(({ id }) => id),
        from,
        to,
      ),
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    moveProject(getIndex(String(active.id)), getIndex(String(over.id)));
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Проект «${getTitle(String(active.id))}» взят. Место ${getPosition(String(active.id))}`,
    onDragOver: ({ active, over }) =>
      over
        ? `Проект «${getTitle(String(active.id))}» над местом ${getPosition(String(over.id))}`
        : `Проект «${getTitle(String(active.id))}» вне списка`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Проект «${getTitle(String(active.id))}» перемещён на место ${getPosition(String(over.id))}`
        : `Проект «${getTitle(String(active.id))}» остался на месте`,
    onDragCancel: ({ active }) =>
      `Перемещение отменено. Проект «${getTitle(String(active.id))}» остался на месте ${getPosition(String(active.id))}`,
  };

  return (
    <div className={clsx(styles.root, className)}>
      <ButtonLink className={styles.addLink} to={routes.projectNew}>
        Добавить проект
      </ButtonLink>

      {projects.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          accessibility={{ announcements, screenReaderInstructions }}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.scroller}>
            <table className={styles.table}>
              <caption>
                <VisuallyHidden>Все проекты в порядке на сайте</VisuallyHidden>
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <VisuallyHidden>Порядок</VisuallyHidden>
                  </th>
                  <th scope="col">Фото</th>
                  <th scope="col">Название</th>
                  <th scope="col">Ссылка</th>
                  <th scope="col">
                    <VisuallyHidden>Действия</VisuallyHidden>
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={projects.map(({ id }) => id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody ref={bodyRef}>
                  {projects.map((project, index) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      disabled={isBusy}
                      isFirst={index === 0}
                      isLast={index === projects.length - 1}
                      onMoveUp={() => moveProject(index, index - 1, "moveUp")}
                      onMoveDown={() => moveProject(index, index + 1, "moveDown")}
                      onDelete={() => setDeleted(project)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      ) : (
        <p className={styles.empty}>Проектов пока нет</p>
      )}

      <div aria-live="polite">
        <VisuallyHidden>{moveAnnouncement}</VisuallyHidden>
      </div>

      <ConfirmDialog
        isOpen={deleted !== undefined}
        title={`Удалить проект «${deleted?.title ?? ""}»?`}
        description="Проект и все его фото пропадут с сайта. Это нельзя отменить."
        cancelLabel="Отмена"
        confirmLabel="Удалить"
        onCancel={() => setDeleted(undefined)}
        onConfirm={() => {
          if (deleted) deletion.mutate(deleted);
          setDeleted(undefined);
        }}
      />
    </div>
  );
}
