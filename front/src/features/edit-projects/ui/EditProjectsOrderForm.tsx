import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm, useWatch } from "react-hook-form";

import { type Project, projectsOrderQuery, projectsQuery } from "@/entities/project";
import type { Tagged } from "@/shared/api/http";
import {
  formatPosition,
  getAnnouncements,
  getScreenReaderInstructions,
} from "@/shared/lib/sortableAnnouncements";
import { useSortableRowFocus } from "@/shared/lib/useSortableRowFocus";
import { restrictToVerticalAxis, useVerticalSortableSensors } from "@/shared/lib/verticalSortable";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { projectSortableMessages } from "../model/projectsOrderMessages";
import { saveProjectsOrderFeedback, useSaveProjectsOrder } from "../model/useSaveProjectsOrder";
import styles from "./EditProjectsOrderForm.module.css";
import { type OrderRowControl, ProjectsOrderRow } from "./ProjectsOrderRow";

interface EditProjectsOrderFormProps {
  className?: string;
  /** The order as stored on the server when the form opens, with its ETag. */
  order: Tagged<string[]>;
  /** The projects, for their titles and covers; their own order does not count. */
  projects: readonly Project[];
}

interface ProjectsOrderFormValues {
  /** Every project, once, in the order the site will show them. */
  ids: string[];
}

function toFormValues(ids: string[]): ProjectsOrderFormValues {
  return { ids };
}

/**
 * The order of the projects on the site. Projects are moved by dragging their handle or with the
 * arrow buttons, which also work without a pointer (WCAG 2.5.7); the new order is sent with
 * «Сохранить», all at once.
 */
export function EditProjectsOrderForm({ className, order, projects }: EditProjectsOrderFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<ProjectsOrderFormValues>({ defaultValues: toFormValues(order.data) });
  const saveOrder = useSaveProjectsOrder();
  const { editForm, saved } = useSavedForm({
    form,
    initial: order,
    query: projectsOrderQuery,
    save: (values, etag) => saveOrder.mutateAsync({ etag, ids: values.ids }),
    toValues: toFormValues,
    toastId: saveProjectsOrderFeedback.toastId,
  });
  const ids = useWatch({ control: form.control, name: "ids" });
  const { focusAfterUpdate, listRef } = useSortableRowFocus<HTMLOListElement>();
  const sensors = useVerticalSortableSensors();
  // Announces a move made with the arrow buttons; dnd-kit announces the dragged ones.
  const [moveAnnouncement, setMoveAnnouncement] = React.useState("");
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  // Each row keeps its index in `ids`, which the moves change: a project created after the list
  // was read has no row yet, so the indexes of the rows may skip it.
  const rows = ids.flatMap((id, index) => {
    const project = projectsById.get(id);

    return project ? [{ index, project }] : [];
  });
  const hasProjectsWithoutRows = rows.length < ids.length;

  // Taking the latest order after a conflict may bring such a project; the list is read again for it.
  React.useEffect(() => {
    if (hasProjectsWithoutRows) {
      void queryClient.invalidateQueries({ queryKey: projectsQuery.queryKey });
    }
  }, [hasProjectsWithoutRows, queryClient]);

  function getIndex(id: string): number {
    return ids.indexOf(id);
  }

  function getTitle(id: string): string {
    return projectsById.get(id)?.title ?? "";
  }

  function moveProject(from: number, to: number, control?: OrderRowControl) {
    const id = ids[from];
    if (id === undefined) return;

    if (control) {
      focusAfterUpdate({ control, itemId: id });
      setMoveAnnouncement(
        projectSortableMessages.moved(getTitle(id), formatPosition(to, ids.length)),
      );
    }
    form.setValue("ids", arrayMove(ids, from, to), { shouldDirty: true });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    moveProject(getIndex(String(active.id)), getIndex(String(over.id)));
  }

  return (
    <EditForm className={className} {...editForm}>
      {rows.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          accessibility={{
            announcements: getAnnouncements(projectSortableMessages, getTitle, (id) =>
              formatPosition(getIndex(id), ids.length),
            ),
            screenReaderInstructions: getScreenReaderInstructions(projectSortableMessages),
          }}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol ref={listRef} className={styles.rows} aria-label="Порядок проектов на сайте">
              {rows.map(({ index, project }) => (
                <ProjectsOrderRow
                  key={project.id}
                  project={project}
                  disabled={editForm.isSaving}
                  isFirst={index === 0}
                  isLast={index === ids.length - 1}
                  isModified={saved.data[index] !== project.id}
                  onMoveUp={() => moveProject(index, index - 1, "moveUp")}
                  onMoveDown={() => moveProject(index, index + 1, "moveDown")}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      ) : (
        <p className={styles.empty}>Проектов пока нет</p>
      )}

      <div aria-live="polite">
        <VisuallyHidden>{moveAnnouncement}</VisuallyHidden>
      </div>
    </EditForm>
  );
}
