import { imageUploadRules } from "@/shared/api/image";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { formatFileSize } from "@/shared/lib/formatFileSize";

import { SaveProcessPhotoError } from "../model/saveProcessPhotos";

export function getSaveTextErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: { 400: "Сервер не принял тексты. Проверьте их и попробуйте ещё раз" },
    fallback: "Не удалось сохранить тексты. Попробуйте ещё раз",
  });
}

function getSaveProcessPhotoErrorMessage(error: unknown, fileName: string): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: `Сервер не принял фото «${fileName}». Попробуйте другой файл`,
      404: `Фото «${fileName}» уже удалено. Обновите страницу`,
      // Only an upload of a new photo is rejected for a full list.
      409: `Фото «${fileName}» не добавлено: фото уже максимум`,
      413: `Фото «${fileName}» больше ${formatFileSize(imageUploadRules.maxFileSize)}`,
    },
    fallback: `Не удалось сохранить фото «${fileName}». Попробуйте ещё раз`,
  });
}

function getSaveProcessPhotoOrderErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      // The photos on the server differ from the ones on the page, e.g. after a save in another
      // tab.
      409: "Порядок фото не сохранён: фото на сервере изменились. Обновите страницу",
    },
    fallback: "Не удалось сохранить порядок фото. Попробуйте ещё раз",
  });
}

/** For a save of the process photos: names the photo whose request failed. */
export function getSaveProcessPhotosErrorMessage(error: unknown): string {
  if (!(error instanceof SaveProcessPhotoError)) {
    return getSaveErrorMessage(error, {
      fallback: "Не удалось сохранить изменения. Попробуйте ещё раз",
    });
  }

  return error.fileName === undefined
    ? getSaveProcessPhotoOrderErrorMessage(error.cause)
    : getSaveProcessPhotoErrorMessage(error.cause, error.fileName);
}
