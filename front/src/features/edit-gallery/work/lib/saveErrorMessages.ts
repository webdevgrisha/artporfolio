import { maxCollectionWorks } from "@/entities/gallery";
import { isPreconditionFailed } from "@/shared/api/httpError";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

export function getSaveWorkErrorMessage(error: unknown): string {
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
export function getCreateWorkErrorMessage(error: unknown): string {
  return isPreconditionFailed(error) ? "Работа уже сохранена" : getSaveWorkErrorMessage(error);
}

export function getDeleteWorkErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Работа уже удалена",
    },
    fallback: "Не удалось удалить работу. Попробуйте ещё раз",
  });
}
