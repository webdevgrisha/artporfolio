import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import styles from "./Sortable.module.css";

interface UseSortableRowParams {
  disabled: boolean;
  id: string;
  /** What a screen reader calls the row, such as «перемещаемое фото». */
  roleDescription: string;
}

/**
 * A row of a SortableList: the props of the row, which useSortableRowFocus finds by its
 * `data-item-id`, and the props of its DragHandle.
 */
export function useSortableRow({ disabled, id, roleDescription }: UseSortableRowParams) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ attributes: { roleDescription }, disabled, id });

  return {
    handleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners },
    rowProps: {
      ref: setNodeRef,
      className: isDragging ? styles.dragging : undefined,
      // Translate only: scaling would stretch rows of different heights into each other.
      style: { transform: CSS.Translate.toString(transform), transition },
      "data-item-id": id,
    },
  };
}

export type SortableHandleProps = ReturnType<typeof useSortableRow>["handleProps"];
