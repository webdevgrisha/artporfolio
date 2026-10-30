import { http } from "@/shared/api/http";

interface DeleteAboutPhotoParams {
  /** The ETag of the photo the deletion was decided on. */
  etag: string;
}

/** Deletes the photo and its files. Succeeds when there is no photo. */
export async function deleteAboutPhoto({ etag }: DeleteAboutPhotoParams): Promise<void> {
  await http.deleteIfMatch({
    path: "/about/photo",
    etag,
  });
}
