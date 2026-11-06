import type { StoredWork } from "#modules/gallery/works/schema";

/** The texts of a work in the source language, by the field their translations are stored under. */
export function workTexts({
  city,
  description,
  photo: { alt },
  title,
}: Pick<StoredWork, "city" | "description" | "title"> & {
  photo: { alt: string };
}): Record<string, string> {
  return { alt, city, description, title };
}
