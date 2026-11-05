import {
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";

import {
  formatPosition,
  getAnnouncements,
  getScreenReaderInstructions,
  type SortableMessages,
} from "./sortableMessages";

/** Rows of a vertical list only move up and down. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

interface SortableListProps {
  /** The rows, each from useSortableRow with the id of its item. */
  children: ReactNode;
  /** Names an item for screen readers. */
  getName: (id: string) => string;
  /** The ids of the items, in order. */
  ids: readonly string[];
  messages: SortableMessages;
  /** Moves the item at index `from` to index `to`. */
  onMove: (from: number, to: number) => void;
}

/**
 * A vertical list whose rows are dragged by their handle, with a pointer or from the keyboard (the
 * handle takes Space or Enter, then the arrows); a screen reader is told each step.
 */
export function SortableList({ children, getName, ids, messages, onMove }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function getPosition(id: string): string {
    return formatPosition(ids.indexOf(id), ids.length);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{
        announcements: getAnnouncements(messages, getName, getPosition),
        screenReaderInstructions: getScreenReaderInstructions(messages),
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={[...ids]} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
