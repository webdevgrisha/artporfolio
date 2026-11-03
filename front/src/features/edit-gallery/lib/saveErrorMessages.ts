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
