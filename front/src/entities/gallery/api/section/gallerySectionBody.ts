import type { TranslationsBody } from "@/shared/api/translations";

import type { Subsection } from "../../model/gallerySection";

/** A section as the admin saves it: its title and the whole list of its subsections. */
export interface GallerySectionBody {
  title: string;
  /** In any order: the site shows them by title. A saved subsection left out is deleted. */
  subsections: readonly Subsection[];
  /** The title, and each subsection by its id; the server makes those sent as null. */
  translations: TranslationsBody;
}
