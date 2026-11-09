import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveIntroErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить текст. Попробуйте ещё раз",
  });
}
