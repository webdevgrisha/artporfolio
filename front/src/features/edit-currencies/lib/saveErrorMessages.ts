import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveCurrencyRatesErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить курсы. Попробуйте ещё раз",
  });
}
