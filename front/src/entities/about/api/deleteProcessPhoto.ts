import { http } from "@/shared/api/http";

interface DeleteProcessPhotoParams {
  id: string;
}

/** Deletes a process photo and its files. Rejected with 404 when there is no such photo. */
export async function deleteProcessPhoto({ id }: DeleteProcessPhotoParams): Promise<void> {
  await http.delete({
    path: `/about/process-photos/${encodeURIComponent(id)}`,
  });
}
