import type { StoredCollection } from "#modules/gallery/collections/schema";

/** The texts of a collection in the source language, by the field their translations go under. */
export function collectionTexts({
  cover: { alt },
  description,
  title,
}: Pick<StoredCollection, "description" | "title"> & {
  cover: { alt: string };
}): Record<string, string> {
  return { alt, description, title };
}
