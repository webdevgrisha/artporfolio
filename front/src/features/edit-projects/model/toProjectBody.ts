import type { ProjectBody } from "@/entities/project";
import { toPhotoListItems } from "@/shared/lib/photoListForm";
import type { ProjectFormValues } from "./projectFormSchema";

/** Uploads the picked files, then gives the project as the server takes it. */
export async function toProjectBody({
  description,
  link,
  photos,
  title,
}: ProjectFormValues): Promise<ProjectBody> {
  return { description, link, photos: await toPhotoListItems(photos), title };
}
