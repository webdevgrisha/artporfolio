import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveIntroErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял текст. Проверьте его и попробуйте ещё раз",
      // The text was changed since this page loaded it, for example in another tab.
      412: "Текст уже изменили в другой вкладке",
    },
    fallback: "Не удалось сохранить текст. Попробуйте ещё раз",
  });
}

export function getReorderErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      // The projects were added, deleted or moved since this page loaded them.
      412: "Проекты уже изменили в другой вкладке. Порядок обновлён, попробуйте ещё раз",
      422: "Проекты уже изменили в другой вкладке. Порядок обновлён, попробуйте ещё раз",
    },
    fallback: "Не удалось изменить порядок. Попробуйте ещё раз",
  });
}

export function getDeleteProjectErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Проект уже удалён",
    },
    fallback: "Не удалось удалить проект. Попробуйте ещё раз",
  });
}
