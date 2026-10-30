import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveContactLinksErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: { 400: "Сервер не принял ссылки. Проверьте их и попробуйте ещё раз" },
    fallback: "Не удалось сохранить ссылки. Попробуйте ещё раз",
  });
}
