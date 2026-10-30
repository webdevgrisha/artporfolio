import type { DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";

import { aboutDocument } from "#modules/about/document";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import {
  type ListPhoto,
  type ListPhotoItem,
  preparePhotoList,
  type StoredListPhoto,
  storedListPhotoSchema,
  toListPhoto,
} from "#shared/images/photo-list";

/** The field of the About document that holds the photos, in the order the site shows them. */
const field = "processPhotos";

/** Every photo has its own folder here, with all its versions. */
const folder = "about/process-photos";

const storedProcessPhotosSchema = z.array(storedListPhotoSchema);

export function readProcessPhotos(snapshot: DocumentSnapshot): StoredListPhoto[] {
  const photos: unknown = snapshot.get(field);

  return photos === undefined ? [] : storedProcessPhotosSchema.parse(photos);
}

/** The photos in their order, and the entity tag of the list for If-Match. */
function toProcessPhotoList(photos: StoredListPhoto[]): Tagged<ListPhoto[]> {
  // The tag follows the stored data, so any change of the list, by any request, changes it.
  return { data: photos.map(toListPhoto), etag: entityTag(photos) };
}

export async function listProcessPhotos(): Promise<Tagged<ListPhoto[]>> {
  return toProcessPhotoList(readProcessPhotos(await aboutDocument().get()));
}

/**
 * Replaces the whole list: the order of `items` is the order on the site, and a saved photo left
 * out is deleted. The new files are copied from their uploads first; then one transaction checks
 * that the list is still the one the client read (`ifMatch`) and writes the new one. The files of
 * the deleted photos and of the replaced versions, and the used uploads, are removed afterwards.
 * If anything fails, the copies are removed and the list stays as it was.
 */
export async function replaceProcessPhotos(
  items: ListPhotoItem[],
  ifMatch: string,
): Promise<Tagged<ListPhoto[]>> {
  const draft = await preparePhotoList(items, folder);
  let saved: StoredListPhoto[];
  let photos: StoredListPhoto[];

  try {
    [saved, photos] = await firestore().runTransaction(async (transaction) => {
      const document = aboutDocument();
      const current = readProcessPhotos(await transaction.get(document));

      assertIfMatch(ifMatch, current);

      const next = draft.build(current);
      // Merging keeps the other fields of the document; the array itself is replaced.
      transaction.set(document, { [field]: next }, { merge: true });
      return [current, next];
    });
  } catch (error) {
    await draft.discard();
    throw error;
  }

  await draft.finish(saved, photos);

  return toProcessPhotoList(photos);
}
