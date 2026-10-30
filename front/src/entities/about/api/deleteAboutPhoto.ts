import { http } from "@/shared/api/http";

/** Deletes the photo and its files. Succeeds when there is no photo. */
export async function deleteAboutPhoto(): Promise<void> {
  await http.delete({
    path: "/about/photo",
  });
}
