import { http } from "@/shared/api/http";

interface DeleteContactPhotoParams {
  csrfToken: string;
}

/** Deletes the photo and its files. Succeeds when there is no photo. */
export async function deleteContactPhoto({ csrfToken }: DeleteContactPhotoParams): Promise<void> {
  await http.delete({
    path: "/contacts/photo",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
}
