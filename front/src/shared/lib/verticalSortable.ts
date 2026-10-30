import { KeyboardSensor, type Modifier, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/** Rows of a vertical list only move up and down. */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** Drags a row with a pointer, or from the keyboard: the handle takes Space or Enter, then arrows. */
export function useVerticalSortableSensors() {
  return useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}
