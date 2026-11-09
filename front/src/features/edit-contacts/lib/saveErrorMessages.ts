import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveContactLinksErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить ссылки. Попробуйте ещё раз",
  });
}
