import { arrayMove } from "@dnd-kit/sortable";
import React from "react";
import { useForm, useWatch } from "react-hook-form";

import { type Project, projectsOrderQuery, projectsQuery } from "@/entities/project";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import {
  formatPosition,
  type MoveControl,
  SortableList,
  useSortableRowFocus,
} from "@/shared/ui/sortable";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { projectSortableMessages } from "../model/projectsOrderMessages";
import { saveProjectsOrderFeedback, useSaveProjectsOrder } from "../model/useSaveProjectsOrder";
import styles from "./EditProjectsOrderForm.module.css";
import { ProjectsOrderRow } from "./ProjectsOrderRow";

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
  const form = useForm<ProjectsOrderFormValues>({ defaultValues: toFormValues(order.data) });
  const saveOrder = useSaveProjectsOrder();
  const { editForm, saved } = useSavedForm({
    form,
    initial: order,
    query: projectsOrderQuery,
    // The latest order may bring a project created in another tab, which needs its row.
    related: [projectsQuery.queryKey],
    save: (values, etag) => saveOrder.mutateAsync({ etag, ids: values.ids }),
    toValues: toFormValues,
    toastId: saveProjectsOrderFeedback.toastId,
  });
  const ids = useWatch({ control: form.control, name: "ids" });
  const { focusAfterUpdate, listRef } = useSortableRowFocus<HTMLOListElement>();
  // Announces a move made with the arrow buttons; dnd-kit announces the dragged ones.
  const [moveAnnouncement, setMoveAnnouncement] = React.useState("");
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  // Each row keeps its index in `ids`, which the moves change: a project created after the list
  // was read has no row yet, so the indexes of the rows may skip it.
  const rows = ids.flatMap((id, index) => {
    const project = projectsById.get(id);

    return project ? [{ index, project }] : [];
  });

  function getTitle(id: string): string {
    return projectsById.get(id)?.title ?? "";
  }

  function moveProject(from: number, to: number, control?: MoveControl) {
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

  return (
    <EditForm className={className} {...editForm}>
      {rows.length > 0 ? (
        <SortableList
          ids={ids}
          messages={projectSortableMessages}
          getName={getTitle}
          onMove={moveProject}
        >
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
        </SortableList>
      ) : (
        <p className={styles.empty}>Проектов пока нет</p>
      )}

      <div aria-live="polite">
        <VisuallyHidden>{moveAnnouncement}</VisuallyHidden>
      </div>
    </EditForm>
  );
}
