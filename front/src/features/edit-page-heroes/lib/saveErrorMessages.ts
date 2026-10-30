import { imageUploadRules } from "@/shared/api/image";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { requestErrorOf } from "@/shared/api/upload";
import { formatFileSize } from "@/shared/lib/formatFileSize";

/** For the hero of one page, named by `pageLabel`. */
export function getSaveHeroErrorMessage(error: unknown, pageLabel: string): string {
  return getSaveErrorMessage(requestErrorOf(error), {
    byStatus: {
      400: `Сервер не принял фото страницы «${pageLabel}». Попробуйте другой файл`,
      413: `Фото страницы «${pageLabel}» больше ${formatFileSize(imageUploadRules.maxFileSize)}`,
      422: `Загрузка фото страницы «${pageLabel}» устарела. Выберите фото ещё раз`,
    },
    fallback: `Не удалось сохранить фото страницы «${pageLabel}». Попробуйте ещё раз`,
  });
}

export function getDeleteHeroErrorMessage(error: unknown, pageLabel: string): string {
  return getSaveErrorMessage(error, {
    fallback: `Не удалось удалить фото страницы «${pageLabel}». Попробуйте ещё раз`,
  });
}
