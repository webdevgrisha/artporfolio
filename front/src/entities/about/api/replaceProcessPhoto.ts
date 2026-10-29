import { http } from "@/shared/api/http";

import { type ProcessPhoto, processPhotoResponseSchema } from "../model/processPhoto";

interface ReplaceProcessPhotoParams {
  alt: string;
  csrfToken: string;
  file: File;
  id: string;
}

/** Replaces the file of a process photo; it keeps its id and its place in the list. */
export async function replaceProcessPhoto({
  alt,
  csrfToken,
  file,
  id,
}: ReplaceProcessPhotoParams): Promise<ProcessPhoto> {
  const body = new FormData();
  body.set("alt", alt);
  body.set("file", file);

  const response = await http.put({
    path: `/about/process-photos/${encodeURIComponent(id)}`,
    body,
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: processPhotoResponseSchema,
  });

  return response.processPhoto;
}
