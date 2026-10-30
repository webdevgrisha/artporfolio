import { http } from "@/shared/api/http";

interface DeleteContactPhotoParams {
  /** The ETag of the photo the deletion was decided on. */
  etag: string;
}

/** Deletes the photo and its files. Succeeds when there is no photo. */
export async function deleteContactPhoto({ etag }: DeleteContactPhotoParams): Promise<void> {
  await http.deleteIfMatch({
    path: "/contacts/photo",
    etag,
  });
}
