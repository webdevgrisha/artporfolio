import { http } from "@/shared/api/http";

import { type ProcessPhoto, processPhotoResponseSchema } from "../model/processPhoto";

interface UpdateProcessPhotoAltParams {
  alt: string;
  csrfToken: string;
  id: string;
}

/** Changes the alt text of a process photo without uploading it again. */
export async function updateProcessPhotoAlt({
  alt,
  csrfToken,
  id,
}: UpdateProcessPhotoAltParams): Promise<ProcessPhoto> {
  const response = await http.patch({
    path: `/about/process-photos/${encodeURIComponent(id)}`,
    body: { alt },
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: processPhotoResponseSchema,
  });

  return response.processPhoto;
}
