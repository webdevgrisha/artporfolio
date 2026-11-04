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

export function getSaveSectionErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял раздел. Проверьте поля и попробуйте ещё раз",
      404: "Раздел уже удалён",
      // Another section has this title, whatever the case.
      409: "Раздел с таким названием уже есть",
      // The section was changed since this page loaded it, for example in another tab.
      412: "Раздел уже изменили в другой вкладке",
    },
    fallback: "Не удалось сохранить раздел. Попробуйте ещё раз",
  });
}

export function getDeleteSectionErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Раздел уже удалён",
    },
    fallback: "Не удалось удалить раздел. Попробуйте ещё раз",
  });
}

export function getSaveMaterialsErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял материалы. Проверьте их и попробуйте ещё раз",
      // The materials were changed since this page loaded them, for example in another tab.
      412: "Материалы уже изменили в другой вкладке",
    },
    fallback: "Не удалось сохранить материалы. Попробуйте ещё раз",
  });
}

export function getSaveColorsErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял цвета. Проверьте их и попробуйте ещё раз",
      // The colors were changed since this page loaded them, for example in another tab.
      412: "Цвета уже изменили в другой вкладке",
    },
    fallback: "Не удалось сохранить цвета. Попробуйте ещё раз",
  });
}

export function getSavePalettesErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял палитры. Проверьте их и попробуйте ещё раз",
      // The palettes were changed since this page loaded them, for example in another tab.
      412: "Палитры уже изменили в другой вкладке",
    },
    fallback: "Не удалось сохранить палитры. Попробуйте ещё раз",
  });
}

export function getSaveWorkErrorMessage(error: unknown): string {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял работу. Проверьте поля и попробуйте ещё раз",
      404: "Работа уже удалена",
      // The work was changed since this page loaded it, for example in another tab.
      412: "Работу уже изменили в другой вкладке",
      // A section was deleted, or an upload expired: it is kept for a day and the work is sent
      // right after it, so that is rare.
      422: "Раздел или фото уже удалены. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить работу. Попробуйте ещё раз",
  });
}

export function getDeleteWorkErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Работа уже удалена",
    },
    fallback: "Не удалось удалить работу. Попробуйте ещё раз",
  });
}

export function getDeleteCollectionErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Коллекция уже удалена",
    },
    fallback: "Не удалось удалить коллекцию. Попробуйте ещё раз",
  });
}

export function getSaveCollectionErrorMessage(error: unknown): string {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял коллекцию. Проверьте поля и попробуйте ещё раз",
      404: "Коллекция уже удалена",
      // Another collection has this title, whatever the case.
      409: "Коллекция с таким названием уже есть",
      // The collection or its works were changed since this page loaded them, for example in
      // another tab.
      412: "Коллекцию или её работы уже изменили в другой вкладке",
      // A work was deleted, or the upload of the cover expired: it is kept for a day and the
      // collection is sent right after it, so that is rare.
      422: "Работа или обложка уже удалены. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить коллекцию. Попробуйте ещё раз",
  });
}
