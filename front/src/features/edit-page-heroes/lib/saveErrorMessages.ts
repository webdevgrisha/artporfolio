import { imageUploadRules } from "@/shared/api/image";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { formatFileSize } from "@/shared/lib/formatFileSize";

/** For the hero of one page, named by `pageLabel`. */
export function getSaveHeroErrorMessage(error: unknown, pageLabel: string): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: `Сервер не принял фото страницы «${pageLabel}». Попробуйте другой файл`,
      413: `Фото страницы «${pageLabel}» больше ${formatFileSize(imageUploadRules.maxFileSize)}`,
    },
    fallback: `Не удалось сохранить фото страницы «${pageLabel}». Попробуйте ещё раз`,
  });
}
