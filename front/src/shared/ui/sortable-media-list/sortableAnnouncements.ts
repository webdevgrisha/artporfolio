import type { SortableMessages } from "@/shared/lib/sortableAnnouncements";

/** What a screen reader says about a moved photo. */
export const photoSortableMessages: SortableMessages = {
  instructions:
    "Чтобы взять фото, нажмите пробел или Enter. Стрелками вверх и вниз выберите новое место, " +
    "затем нажмите пробел или Enter. Escape отменяет перемещение",
  picked: (name, position) => `Фото «${name}» взято. Место ${position}`,
  over: (name, position) => `Фото «${name}» над местом ${position}`,
  outside: (name) => `Фото «${name}» вне списка`,
  moved: (name, position) => `Фото «${name}» перемещено на место ${position}`,
  stayed: (name) => `Фото «${name}» осталось на месте`,
  cancelled: (name, position) =>
    `Перемещение отменено. Фото «${name}» осталось на месте ${position}`,
};
