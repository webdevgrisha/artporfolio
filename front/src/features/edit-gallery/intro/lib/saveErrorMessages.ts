import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveIntroErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить текст. Попробуйте ещё раз",
  });
}
