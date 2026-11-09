import type { Collection, StoredCollection } from "#modules/gallery/collections/schema";
import { entityTag, type Tagged } from "#shared/http/etag";
import { toPhoto } from "#shared/images/photo";

/** The stored collection as the API returns it, with download URLs and ISO 8601 dates. */
export function toCollection(
  id: string,
  { cover, createdAt, description, endYear, startYear, title, updatedAt }: StoredCollection,
  workIds: string[],
): Collection {
  return {
    cover: toPhoto(cover),
    createdAt: createdAt.toDate().toISOString(),
    description,
    endYear,
    id,
    startYear,
    title,
    updatedAt: updatedAt.toDate().toISOString(),
    workIds,
  };
}

/** The collection as the API returns it, tagged by that representation, its works included. */
export function toSavedCollection(
  id: string,
  collection: StoredCollection,
  workIds: string[],
): Tagged<Collection> {
  const data = toCollection(id, collection, workIds);

  return { data, etag: entityTag(data) };
}
