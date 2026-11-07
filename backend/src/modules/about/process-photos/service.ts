import type { DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";

import { aboutDocument } from "#modules/about/document";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { saveTranslations } from "#shared/i18n/translating";
import {
  type StoredTranslations,
  storedTranslationsSchema,
  type Translations,
  textsById,
  toTranslations,
} from "#shared/i18n/translations";
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

/** The field that holds the alt texts in the other languages, by the id of the photo. */
const translationsField = "processPhotoTranslations";

/** Every photo has its own folder here, with all its versions. */
const folder = "about/process-photos";

const storedProcessPhotosSchema = z.array(storedListPhotoSchema);

export function readProcessPhotos(snapshot: DocumentSnapshot): StoredListPhoto[] {
  const photos: unknown = snapshot.get(field);

  return photos === undefined ? [] : storedProcessPhotosSchema.parse(photos);
}

function readTranslations(snapshot: DocumentSnapshot): StoredTranslations {
  const translations: unknown = snapshot.get(translationsField);

  return translations === undefined ? {} : storedTranslationsSchema.parse(translations);
}

/** The photos as stored, with their alt texts in the other languages. */
interface StoredProcessPhotos {
  photos: StoredListPhoto[];
  translations: StoredTranslations;
}

/** The photos as the API returns them. */
export interface ProcessPhotoList {
  photos: ListPhoto[];
  /** The alt texts in the other languages, by the id of the photo. */
  translations: Translations;
}

function readStored(snapshot: DocumentSnapshot): StoredProcessPhotos {
  return { photos: readProcessPhotos(snapshot), translations: readTranslations(snapshot) };
}

function altTexts(photos: readonly { alt: string; id: string }[]): Record<string, string> {
  return textsById(photos, (photo) => photo.alt);
}

/** The photos with their translations as the API returns them. */
export function toProcessPhotoTranslations(snapshot: DocumentSnapshot): Translations {
  return toTranslations(readTranslations(snapshot), altTexts(readProcessPhotos(snapshot)));
}

/** The photos in their order, and the entity tag of the list for If-Match. */
function toProcessPhotoList(stored: StoredProcessPhotos): Tagged<ProcessPhotoList> {
  return {
    data: {
      photos: stored.photos.map(toListPhoto),
      translations: toTranslations(stored.translations, altTexts(stored.photos)),
    },
    // The tag follows the stored data, so any change of the list, by any request, changes it.
    etag: entityTag(stored),
  };
}

export async function listProcessPhotos(): Promise<Tagged<ProcessPhotoList>> {
  return toProcessPhotoList(readStored(await aboutDocument().get()));
}

/**
 * Replaces the whole list: the order of `items` is the order on the site, and a saved photo left
 * out is deleted. One transaction checks that the list is still the one the client read (`ifMatch`)
 * and writes the new one. The alt texts are translated before it, as it may run several times: the
 * tag checked there covers the translations, so the ones it started from are still the saved ones.
 */
export function replaceProcessPhotos(
  items: ListPhotoItem[],
  ifMatch: string,
): Promise<Tagged<ProcessPhotoList>> {
  return saveWithImages(async (files) => {
    const before = readStored(await aboutDocument().get());

    // Nothing is paid for a change that the check in the transaction would reject anyway.
    assertIfMatch(ifMatch, before);

    const draft = await preparePhotoList(files, items, folder);
    const translations = await saveTranslations(altTexts(draft.alts), before.translations, {});
    const [saved, photos] = await firestore().runTransaction(async (transaction) => {
      const document = aboutDocument();
      const current = readStored(await transaction.get(document));

      assertIfMatch(ifMatch, current);

      const next = draft.build(current.photos);
      // Only these fields are replaced: the document holds others, such as the texts.
      transaction.set(
        document,
        { [field]: next, [translationsField]: translations },
        { mergeFields: [field, translationsField] },
      );
      return [current.photos, next];
    });

    draft.removeUnused(saved, photos);

    return toProcessPhotoList({ photos, translations });
  });
}
