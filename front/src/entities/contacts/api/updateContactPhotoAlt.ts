import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface UpdateContactPhotoAltParams {
  alt: string;
}

/** Changes the alt text without uploading the photo again. */
export async function updateContactPhotoAlt({ alt }: UpdateContactPhotoAltParams): Promise<Photo> {
  const response = await http.patch({
    path: "/contacts/photo",
    body: { alt },
    schema: photoResponseSchema,
  });

  return response.photo;
}
