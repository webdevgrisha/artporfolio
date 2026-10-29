import { http } from "@/shared/api/http";

interface DeleteAboutPhotoParams {
  csrfToken: string;
}

/** Deletes the photo and its files. Succeeds when there is no photo. */
export async function deleteAboutPhoto({ csrfToken }: DeleteAboutPhotoParams): Promise<void> {
  await http.delete({
    path: "/about/photo",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
}
