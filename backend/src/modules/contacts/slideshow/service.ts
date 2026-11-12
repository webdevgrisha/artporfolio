import type { DocumentSnapshot } from "firebase-admin/firestore";

import { contactsDocument } from "#modules/contacts/document";
import {
  type Slideshow,
  type SlideshowBody,
  type StoredSlideshow,
  storedSlideshowSchema,
} from "#modules/contacts/slideshow/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { requestTranslations, saveSources } from "#shared/i18n/translation-requests";
import { textsById } from "#shared/i18n/translations";
import { preparePhotoList, toListPhoto } from "#shared/images/photo-list";
import { saveWithImages } from "#shared/images/saving";

/** The field of the contacts document that holds the slideshow. */
const field = "slideshow";

/** Every uploaded photo has its own folder here, with all its versions. */
const folder = "contacts/slideshow";

/** Where the translations of the alt texts of the uploaded photos go. */
export const slideshowTranslations = "contacts-slideshow";

/** Until the first save, the slideshow shows the uploaded photos, of which there are none. */
const emptySlideshow: StoredSlideshow = { photos: [], source: "uploaded" };

export function readSlideshow(snapshot: DocumentSnapshot): StoredSlideshow {
  const slideshow: unknown = snapshot.get(field);

  return slideshow === undefined ? emptySlideshow : storedSlideshowSchema.parse(slideshow);
}

/** The slideshow with download URLs, and its entity tag for If-Match. */
function toTaggedSlideshow(slideshow: StoredSlideshow): Tagged<Slideshow> {
  // The tag follows the stored data, so any change of the slideshow, by any request, changes it.
  return {
    data: { photos: slideshow.photos.map(toListPhoto), source: slideshow.source },
    etag: entityTag(slideshow),
  };
}

export async function getSlideshow(): Promise<Tagged<Slideshow>> {
  return toTaggedSlideshow(readSlideshow(await contactsDocument().get()));
}

/**
 * Replaces the whole slideshow: the source, and the uploaded photos, whose order is the order on
 * the site; a saved photo left out is deleted. One transaction checks that the slideshow is still
 * the one the client read (`ifMatch`) and writes the new one.
 */
export function replaceSlideshow(
  { photos: items, source }: SlideshowBody,
  ifMatch: string,
): Promise<Tagged<Slideshow>> {
  return saveWithImages(async (files) => {
    const draft = await preparePhotoList(files, items, folder);
    const [saved, slideshow] = await firestore().runTransaction(async (transaction) => {
      const document = contactsDocument();
      const current = readSlideshow(await transaction.get(document));

      assertIfMatch(ifMatch, current);

      const next: StoredSlideshow = { photos: draft.build(current.photos), source };
      // Merging keeps the links; the slideshow itself is replaced.
      transaction.set(document, { [field]: next }, { merge: true });
      saveSources(
        transaction,
        slideshowTranslations,
        textsById(next.photos, ({ alt }) => alt),
      );
      return [current, next];
    });

    draft.removeUnused(saved.photos, slideshow.photos);
    await requestTranslations(slideshowTranslations);

    return toTaggedSlideshow(slideshow);
  });
}
