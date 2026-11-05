import { maxCollectionWorks } from "@/entities/gallery";
import { isPreconditionFailed } from "@/shared/api/httpError";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

export function getSaveIntroErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить текст. Попробуйте ещё раз",
  });
}

export function getSaveSectionErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Раздел уже удалён",
      // Another section has this title, whatever the case.
      409: "Раздел с таким названием уже есть",
    },
    fallback: "Не удалось сохранить раздел. Попробуйте ещё раз",
  });
}

/**
 * A new section: 412 says an earlier try already saved it although its response was lost
 * and the form opens it.
 */
export function getCreateSectionErrorMessage(error: unknown): string | null {
  return isPreconditionFailed(error) ? "Раздел уже сохранён" : getSaveSectionErrorMessage(error);
}

export function getDeleteSectionErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Раздел уже удалён",
    },
    fallback: "Не удалось удалить раздел. Попробуйте ещё раз",
  });
}

export function getSaveMaterialsErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить материалы. Попробуйте ещё раз",
  });
}

export function getSaveColorsErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить цвета. Попробуйте ещё раз",
  });
}

export function getSavePalettesErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить палитры. Попробуйте ещё раз",
  });
}

export function getSaveWorkErrorMessage(error: unknown): string | null {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Работа уже удалена",
      // The chosen collection already holds the most works it may.
      409: `В коллекции уже ${String(maxCollectionWorks)} работ, больше добавить нельзя`,
      // A section, a list item or the collection was deleted, or an upload expired: it is kept for
      // a day and the work is sent right after it, so that is rare.
      422: "Что-то из выбранного или фото уже удалены. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить работу. Попробуйте ещё раз",
  });
}

/**
 * A new work: 412 says an earlier try already saved it although its response was lost
 * and the form opens it.
 */
export function getCreateWorkErrorMessage(error: unknown): string | null {
  return isPreconditionFailed(error) ? "Работа уже сохранена" : getSaveWorkErrorMessage(error);
}

export function getDeleteWorkErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Работа уже удалена",
    },
    fallback: "Не удалось удалить работу. Попробуйте ещё раз",
  });
}

export function getDeleteCollectionErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Коллекция уже удалена",
    },
    fallback: "Не удалось удалить коллекцию. Попробуйте ещё раз",
  });
}

export function getSaveCollectionErrorMessage(error: unknown): string | null {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Коллекция уже удалена",
      // Another collection has this title, whatever the case.
      409: "Коллекция с таким названием уже есть",
      // A work was deleted, or the upload of the cover expired: it is kept for a day and the
      // collection is sent right after it, so that is rare.
      422: "Работа или обложка уже удалены. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить коллекцию. Попробуйте ещё раз",
  });
}

/**
 * A new collection: 412 says an earlier try already saved it although its response was lost
 * and the form opens it.
 */
export function getCreateCollectionErrorMessage(error: unknown): string | null {
  return isPreconditionFailed(error)
    ? "Коллекция уже сохранена"
    : getSaveCollectionErrorMessage(error);
}
