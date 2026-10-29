import { http } from "@/shared/api/http";

interface DeleteProcessPhotoParams {
  csrfToken: string;
  id: string;
}

/** Deletes a process photo and its files. Rejected with 404 when there is no such photo. */
export async function deleteProcessPhoto({
  csrfToken,
  id,
}: DeleteProcessPhotoParams): Promise<void> {
  await http.delete({
    path: `/about/process-photos/${encodeURIComponent(id)}`,
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
}
