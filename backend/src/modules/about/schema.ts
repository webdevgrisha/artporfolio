import type { AboutText } from "#modules/about/text/schema";
import type { Translated } from "#shared/i18n/translated-resource";
import type { Translations } from "#shared/i18n/translations";
import type { SlotPhoto } from "#shared/images/photo";
import type { ListPhoto } from "#shared/images/photo-list";

/** The whole About page in one read, for the site; each part is changed at its own resource. */
export interface AboutResponse {
  text: Translated<AboutText>;
  /** «My photo»; null until one is uploaded. */
  photo: SlotPhoto | null;
  /** In the order the site shows them. */
  processPhotos: ListPhoto[];
  /** The alt texts of the process photos in the other languages, by the id of the photo. */
  processPhotoTranslations: Translations;
}
