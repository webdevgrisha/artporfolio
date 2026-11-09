import { isPreconditionFailed } from "@/shared/api/httpError";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveSectionErrorMessage(error: unknown): string {
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
export function getCreateSectionErrorMessage(error: unknown): string {
  return isPreconditionFailed(error) ? "Раздел уже сохранён" : getSaveSectionErrorMessage(error);
}

export function getDeleteSectionErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      404: "Раздел уже удалён",
    },
    fallback: "Не удалось удалить раздел. Попробуйте ещё раз",
  });
}
