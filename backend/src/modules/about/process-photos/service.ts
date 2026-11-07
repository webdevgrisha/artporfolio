import type { DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";

import { aboutDocument } from "#modules/about/document";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { requestTranslations, saveSources } from "#shared/i18n/translation-requests";
import { textsById } from "#shared/i18n/translations";
import {
  type ListPhoto,
  type ListPhotoItem,
  preparePhotoList,
  type StoredListPhoto,
  storedListPhotoSchema,
  toListPhoto,
} from "#shared/images/photo-list";
import { saveWithImages } from "#shared/images/saving";

/** The field of the About document that holds the photos, in the order the site shows them. */
const field = "processPhotos";

/** Every photo has its own folder here, with all its versions. */
const folder = "about/process-photos";

/** Where the translations of the alt texts go. */
const translationResource = "about-process-photos";

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
 * out is deleted. One transaction checks that the list is still the one the client read (`ifMatch`)
 * and writes the new one.
 */
export function replaceProcessPhotos(
  items: ListPhotoItem[],
  ifMatch: string,
): Promise<Tagged<ListPhoto[]>> {
  return saveWithImages(async (files) => {
    const draft = await preparePhotoList(files, items, folder);
    const [saved, photos] = await firestore().runTransaction(async (transaction) => {
      const document = aboutDocument();
      const current = readProcessPhotos(await transaction.get(document));

      assertIfMatch(ifMatch, current);

      const next = draft.build(current);
      // Merging keeps the other fields of the document; the array itself is replaced.
      transaction.set(document, { [field]: next }, { merge: true });
      saveSources(
        transaction,
        translationResource,
        textsById(next, ({ alt }) => alt),
      );
      return [current, next];
    });

    draft.removeUnused(saved, photos);
    await requestTranslations(translationResource);

    return toProcessPhotoList(photos);
  });
}
