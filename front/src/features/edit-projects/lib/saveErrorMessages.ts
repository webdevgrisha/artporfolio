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
