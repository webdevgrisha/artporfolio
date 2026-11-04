import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";

/**
 * What a screen reader says about one kind of sortable item. Each list writes its own texts, so
 * the words agree with its noun: «Фото … взято», «Проект … взят».
 */
export interface SortableMessages {
  /** Read when the drag handle takes the focus. */
  instructions: string;
  picked: (name: string, position: string) => string;
  over: (name: string, position: string) => string;
  outside: (name: string) => string;
  moved: (name: string, position: string) => string;
  stayed: (name: string) => string;
  cancelled: (name: string, position: string) => string;
}

/** The position of an item for people: «3 из 5». */
export function formatPosition(index: number, count: number): string {
  return `${String(index + 1)} из ${String(count)}`;
}

export function getScreenReaderInstructions(messages: SortableMessages): ScreenReaderInstructions {
  return { draggable: messages.instructions };
}

/**
 * What a screen reader says while an item is dragged. dnd-kit reports ids, so the caller gives the
 * name and the position of each one.
 */
export function getAnnouncements(
  messages: SortableMessages,
  getName: (id: string) => string,
  getPosition: (id: string) => string,
): Announcements {
  return {
    onDragStart({ active }) {
      const id = String(active.id);
      return messages.picked(getName(id), getPosition(id));
    },
    onDragOver({ active, over }) {
      const name = getName(String(active.id));
      return over ? messages.over(name, getPosition(String(over.id))) : messages.outside(name);
    },
    onDragEnd({ active, over }) {
      const name = getName(String(active.id));
      return over ? messages.moved(name, getPosition(String(over.id))) : messages.stayed(name);
    },
    onDragCancel({ active }) {
      const id = String(active.id);
      return messages.cancelled(getName(id), getPosition(id));
    },
  };
}
