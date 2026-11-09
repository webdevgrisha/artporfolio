import { isPreconditionFailed } from "@/shared/api/httpError";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

export function getSaveIntroErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить текст. Попробуйте ещё раз",
  });
}

export function getSaveOrderErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
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
      404: "Проект уже удалён",
      // Another project has this title, whatever the case.
      409: "Проект с таким названием уже есть",
      422: "Фото на сервере изменились. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить проект. Попробуйте ещё раз",
  });
}

/**
 * A new project: 412 says an earlier try already saved it although its response was lost
 * and the form opens it.
 */
export function getCreateProjectErrorMessage(error: unknown): string {
  return isPreconditionFailed(error) ? "Проект уже сохранён" : getSaveProjectErrorMessage(error);
}
