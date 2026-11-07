import type { ListPhotoItem } from "@/shared/api/photo";

/** A project as the admin saves it: every field, and the whole list of its photos. */
export interface ProjectBody {
  title: string;
  description: string;
  link: string;
  /** In the order the site shows them; a saved photo left out is deleted. */
  photos: readonly ListPhotoItem[];
}
