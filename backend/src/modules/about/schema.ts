import type { AboutText } from "#modules/about/text/schema";
import type { Photo } from "#shared/images/photo";
import type { ListPhoto } from "#shared/images/photo-list";

/** The whole About page in one read, for the site; each part is changed at its own resource. */
export interface AboutResponse {
  text: AboutText;
  /** «My photo»; null until one is uploaded. */
  photo: Photo | null;
  /** In the order the site shows them. */
  processPhotos: ListPhoto[];
}
