import type { StoredWork } from "#modules/gallery/works/schema";
import { textsById } from "#shared/i18n/translations";

/**
 * The texts of a work in the source language, by the key of their translations: a process photo by
 * its id. Its alt text is translated too, so the site has it in every language; no form shows it.
 */
export function workTexts({
  city,
  description,
  photo: { alt },
  processPhotos,
  title,
}: Pick<StoredWork, "city" | "description" | "title"> & {
  photo: { alt: string };
  processPhotos: readonly { alt: string; id: string }[];
}): Record<string, string> {
  return { alt, city, description, title, ...textsById(processPhotos, (photo) => photo.alt) };
}
