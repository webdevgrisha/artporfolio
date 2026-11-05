import { isPreconditionFailed } from "@/shared/api/httpError";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

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
      // A work was deleted or put in another collection, or the upload of the cover expired: it is
      // kept for a day and the collection is sent right after it, so that is rare.
      422: "Работа уже удалена или попала в другую коллекцию, или обложка устарела. Обновите страницу и внесите изменения заново",
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
