import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";

/** Read to a screen reader user when the drag handle takes the focus. */
export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "Чтобы взять фото, нажмите пробел или Enter. Стрелками вверх и вниз выберите новое место, " +
    "затем нажмите пробел или Enter. Escape отменяет перемещение",
};

/** The position of an item for people: «3 из 5». */
export function formatPosition(index: number, count: number): string {
  return `${String(index + 1)} из ${String(count)}`;
}

/**
 * What a screen reader says while an item is dragged. dnd-kit reports ids, so the caller
 * gives the name and the position of each one.
 */
export function getAnnouncements(
  getName: (id: string) => string,
  getPosition: (id: string) => string,
): Announcements {
  return {
    onDragStart({ active }) {
      const id = String(active.id);
      return `Фото «${getName(id)}» взято. Место ${getPosition(id)}`;
    },
    onDragOver({ active, over }) {
      if (!over) return `Фото «${getName(String(active.id))}» вне списка`;
      return `Фото «${getName(String(active.id))}» над местом ${getPosition(String(over.id))}`;
    },
    onDragEnd({ active, over }) {
      if (!over) return `Фото «${getName(String(active.id))}» осталось на месте`;
      return `Фото «${getName(String(active.id))}» перемещено на место ${getPosition(String(over.id))}`;
    },
    onDragCancel({ active }) {
      const id = String(active.id);
      return `Перемещение отменено. Фото «${getName(id)}» осталось на месте ${getPosition(id)}`;
    },
  };
}
