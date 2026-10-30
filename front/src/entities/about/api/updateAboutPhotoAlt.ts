import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface UpdateAboutPhotoAltParams {
  alt: string;
}

/** Changes the alt text without uploading the photo again. */
export async function updateAboutPhotoAlt({ alt }: UpdateAboutPhotoAltParams): Promise<Photo> {
  const response = await http.patch({
    path: "/about/photo",
    body: { alt },
    schema: photoResponseSchema,
  });

  return response.photo;
}
