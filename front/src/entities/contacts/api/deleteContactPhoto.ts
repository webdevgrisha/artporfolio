import { http } from "@/shared/api/http";

/** Deletes the photo and its files. Succeeds when there is no photo. */
export async function deleteContactPhoto(): Promise<void> {
  await http.delete({
    path: "/contacts/photo",
  });
}
