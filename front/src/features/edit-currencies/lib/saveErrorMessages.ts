import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveCurrencyRatesErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял курсы. Проверьте их и попробуйте ещё раз",
      // The rates were changed since this page loaded them, for example in another tab.
      412: "Курсы уже изменили в другой вкладке",
    },
    fallback: "Не удалось сохранить курсы. Попробуйте ещё раз",
  });
}
