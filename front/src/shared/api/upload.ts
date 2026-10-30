import { z } from "zod";

import { formatFileSize } from "@/shared/lib/formatFileSize";

import { http } from "./http";
import { imageUploadRules } from "./image";
import { getSaveErrorMessage } from "./requestErrorMessages";

const uploadResponseSchema = z.object({
  upload: z.object({ id: z.string() }),
});

/** A photo that was not uploaded; `cause` is the request error. */
export class UploadError extends Error {
  readonly fileName: string;

  constructor(fileName: string, cause: unknown) {
    super(`Could not upload ${fileName}`, { cause });
    this.name = "UploadError";
    this.fileName = fileName;
  }
}

/**
 * Uploads a photo for a later change to refer to, and returns the id of the upload: the server
 * keeps it for a day (backend/src/shared/images/uploads.ts). Rejects with `UploadError`.
 */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.set("file", file);

  try {
    const response = await http.post({ path: "/uploads", body, schema: uploadResponseSchema });
    return response.upload.id;
  } catch (error) {
    throw new UploadError(file.name, error);
  }
}

export function getUploadErrorMessage({ cause, fileName }: UploadError): string {
  return getSaveErrorMessage(cause, {
    byStatus: {
      400: `Сервер не принял фото «${fileName}». Попробуйте другой файл`,
      413: `Фото «${fileName}» больше ${formatFileSize(imageUploadRules.maxFileSize)}`,
    },
    fallback: `Не удалось загрузить фото «${fileName}». Попробуйте ещё раз`,
  });
}
