import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveContactLinksErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял ссылки. Проверьте их и попробуйте ещё раз",
      // The links were changed since this page loaded them, for example in another tab.
      412: "Ссылки уже изменили в другой вкладке. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить ссылки. Попробуйте ещё раз",
  });
}
