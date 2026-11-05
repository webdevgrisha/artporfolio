import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveContactLinksErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить ссылки. Попробуйте ещё раз",
  });
}
