import type { SortableMessages } from "@/shared/lib/sortableAnnouncements";

/** What a screen reader says about a moved project. */
export const projectSortableMessages: SortableMessages = {
  instructions:
    "Чтобы взять проект, нажмите пробел или Enter. Стрелками вверх и вниз выберите новое место, " +
    "затем нажмите пробел или Enter. Escape отменяет перемещение",
  picked: (name, position) => `Проект «${name}» взят. Место ${position}`,
  over: (name, position) => `Проект «${name}» над местом ${position}`,
  outside: (name) => `Проект «${name}» вне списка`,
  moved: (name, position) => `Проект «${name}» перемещён на место ${position}`,
  stayed: (name) => `Проект «${name}» остался на месте`,
  cancelled: (name, position) =>
    `Перемещение отменено. Проект «${name}» остался на месте ${position}`,
};
