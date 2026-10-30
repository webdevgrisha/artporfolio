import { http } from "@/shared/api/http";

import { type ProcessPhoto, processPhotoResponseSchema } from "../model/processPhoto";

interface AddProcessPhotoParams {
  alt: string;
  file: File;
}

/**
 * Uploads a new process photo to the end of the list and returns it as stored by the server.
 * Rejected with 409 when the list is full.
 */
export async function addProcessPhoto({ alt, file }: AddProcessPhotoParams): Promise<ProcessPhoto> {
  const body = new FormData();
  body.set("alt", alt);
  body.set("file", file);

  const response = await http.post({
    path: "/about/process-photos",
    body,
    schema: processPhotoResponseSchema,
  });

  return response.processPhoto;
}
