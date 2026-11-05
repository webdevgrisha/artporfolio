import { HttpError } from "@/shared/api/httpError";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

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

export function getSaveOrderErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      // The projects were added, deleted or moved since this page loaded them.
      412: "Проекты уже изменили в другой вкладке",
      422: "Проекты уже изменили в другой вкладке. Обновите страницу",
    },
    fallback: "Не удалось сохранить порядок. Попробуйте ещё раз",
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

export function getSaveProjectErrorMessage(error: unknown): string {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял проект. Проверьте поля и попробуйте ещё раз",
      404: "Проект уже удалён",
      // Another project has this title, whatever the case.
      409: "Проект с таким названием уже есть",
      // The project was changed since this page loaded it, for example in another tab.
      412: "Проект уже изменили в другой вкладке",
      422: "Фото на сервере изменились. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить проект. Попробуйте ещё раз",
  });
}

/**
 * A new project: 412 says an earlier try already saved it although its response was lost
 * (useCreateConflict).
 */
export function getCreateProjectErrorMessage(error: unknown): string {
  return error instanceof HttpError && error.status === 412
    ? "Проект уже сохранён"
    : getSaveProjectErrorMessage(error);
}
